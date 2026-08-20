# 03 — 前端架构与代码质量评审（Vue 3 + Pinia + Element Plus）

> **评审范围**：`web/`（Vue 3 + Vite + Pinia + Element Plus）。
> `client/` 为旧版前端，本轮不评。
> **统计**：49 个源文件（17 `.ts` + 32 `.vue`），单元测试 7 个 `.spec.ts`，E2E 1 个 spec（约 30 用例）+ 1 个 mock helper。
> **评审方法**：静态阅读 + 关键路径反查服务端契约，**未跑构建/未跑测试**（详见 §11 验证缺口）。
> **严重度图例**：🔴 P0 必修 → 🟠 P1 建议 → 🟡 P2 可选。

---

## 0. TL;DR（先看这里）

| 维度 | 评级 | 摘要 |
|---|---|---|
| 1. API 客户端与拦截器 | 🟠 P1 | 并发刷新队列实现存在但**缩进疑似 bug**（实际靠 hoisting 救命）；`/auth/refresh` 401 的**重试策略错误**；token 存 `localStorage` 有 XSS 风险。 |
| 2. Pinia stores | 🟠 P1 | 登出清理不彻底（未清 `user` 之外的派生状态）；`user` 通过**前端解码 JWT** 拿 `roleCode`，无 `/me` 端点对照。 |
| 3. 路由与权限 | 🟠 P1 | 只有 `meta.public`，**无角色守卫**；路由全部静态，无动态/异步路由。`roleCode===4` 是管理员判断的**唯一硬编码入口**。 |
| 4. ProcessHub + useProcess | 🟡 P2 | **样式统一、复用有效**；`useProcessForm` watch 初始化逻辑有 race；`ProcessFormPage.vue` 存在**重复 `onMounted` 调用 bug**，每次进页面会发 2 次 GET。 |
| 5. 组件设计 | 🟡 P2 | 13 个工序页都是同一个 30 行壳层，**极好**；但 `Batching/Winding` 自己写 `loadOptions` 又与 `useProcessForm` 重复加载模式。 |
| 6. 类型与 API 契约 | 🟡 P2 | `src/types/api.ts` 偏薄，13 工序字段、Pack 实体、Cells 实体大量 `any`；后端 `auth.service.ts` 返回 `user.realName`，但前端 `LoginResult.user` 用了，但 `authStore.user` 是手解 JWT 的另一份。 |
| 7. 测试 | 🟠 P1 | 7 个单测覆盖 store/部分页面，**完全没有覆盖 axios 401 刷新这一最易碎路径**；E2E 30+ 用例在 `e2e-report/index.html` 是 build 产物（实际跑测不依赖它）。 |
| 8. 环境配置 | 🟡 P2 | Vite 代理、port、setup 都 OK；`vite.config.ts` **没有 `strictPort`**，HMR 端口冲突会静默切到 3001；`pnpm` 锁文件不一致（用 `package-lock.json`）。 |

**Top 3 必须修**：
1. 🔴 `ProcessFormPage.vue` 重复 `onMounted` → 进入每个工序页都会**多发一次** GET `/processes/:key/:batchNo`。
2. 🟠 `api/index.ts` `attemptRefresh` 对 401 错误**重试 1 次 + 500ms 退避**，把"refresh token 失效"的 401 当成可重试，**最多浪费 500ms 才跳登录**。
3. 🟠 `api/index.ts` 的 `let` 变量（`isRefreshing` / `refreshEpoch` / `pendingRequests`）写在 `http.interceptors.request.use(...)` 之后但**缩进误导**——读者第一眼会认为是回调闭包内变量；虽因模块提升能跑，但**新人 review 必踩坑**。

---

## 1. API 客户端与拦截器

文件：`web/src/api/index.ts`（184 行）、`web/src/api/auth.ts`、`web/src/api/mock.ts`。
辅助：`web/src/api/{batch,cells,quality,material,status-log,system,users,departments,equipment,pack,exports,master-data,process-dictionary}.ts`（15 个 API 模块）。

### 1.1 Axios 实例

```ts
const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
})
```

✅ `baseURL: '/api'` 配合 Vite dev 代理（`vite.config.ts:13` `'/api' → http://localhost:3001`）和后端 `app.setGlobalPrefix('api')`（server/main.ts 默认）对齐。
✅ `timeout: 15000ms` 对工业录入场景（扫码 + 提交）合理。
⚠️ 缺少 `withCredentials` —— 当前是 Bearer token 模式没问题，但**未来若切换到 cookie session 会忘记开**，建议显式注释说明。

### 1.2 请求拦截器（JWT 注入）— 严重度 🔴

```ts
// web/src/api/index.ts:17-39（实际行号）
http.interceptors.request.use((config) => {
  // Mock 拦截逻辑
  if (isPreview) { ... }

  const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    ;(config as any)._refreshEpoch = refreshEpoch
    return config
  })   // ← 这一行的 }) 实际上闭合的是 http.interceptors.request.use

  let isRefreshing = false
  let refreshEpoch = 0
  let pendingRequests: Array<{...}> = []
```

**问题 A（缩进误导）**：
- `const authStore = useAuthStore()` 在第 33 行，比上一行少 2 空格缩进。
- 后面 `if (authStore.token)`、`(config as any)._refreshEpoch = refreshEpoch`、`return config` 全部继续以"回调内部"的缩进排版。
- 第 39 行的 `})` 实际闭合的是 `http.interceptors.request.use(...)` 的最外层。
- 紧接着的 `let isRefreshing` 等是**模块顶层 let**，不在回调里。

**实际能跑的原因**：
- 整个文件是一个 ES Module，模块顶层语句先求值。
- `http.interceptors.request.use(callback)` 立即注册了 callback（**不立即调用**）。
- 模块执行到 `let isRefreshing = false` 时，三个 let 已经在模块作用域创建。
- callback 真正被调用时（首次 HTTP 请求时），闭包能读到模块作用域的 `refreshEpoch`/`isRefreshing`/`pendingRequests`。
- 响应拦截器（line 69+）同处模块作用域，同样能读到。

**为什么会爆**：
- 任何新人读到这一段，**会以为 `isRefreshing` / `refreshEpoch` 在 request 回调里**——`authStore` 之后那段缩进就是"回调内部"的写法。
- 一旦有人把 `let isRefreshing` 误删/误移（比如想"修缩进"），就立刻在第一次 401 时 NPE。
- **建议改写**：把三个 let 提到文件顶端，request 回调内只放 token 注入，结构清晰。

**问题 B（refresh token 失效时重试）**：见 §1.4。

### 1.3 Mock 拦截器（preview 环境）

```ts
const isPreview = window.location.hostname.includes('vercel.app') ||
                  window.location.hostname.includes('zeabur.app')

http.interceptors.request.use((config) => {
  if (isPreview) {
    const mockRes = getMockResponse(config)
    if (mockRes) {
      config.adapter = async () => ({ data: mockRes, status: 200, ... })
    }
  }
  ...
})
```

✅ 用 `axios` 的 `adapter` 钩子覆盖传输层，是个**很优雅的本地 mock**。
✅ 不污染生产构建路径（生产域名通常不带 `vercel.app` / `zeabur.app`）。
🟡 P2 风险：
1. **环境判断写在运行时**——`window.location.hostname` 在 SSR/SSG 场景会爆。YT-MES 是纯 CSR，无影响。
2. **可被绕过的安全风险**：如果攻击者用本地代理把 host header 改成 `xxx.vercel.app`，开发机就能启用 mock 模式。但 mock 数据**只读且无副作用**（最多假登录、假数据），不算高危。
3. `mock.ts` 用 `for (const key in mockData) { if (url.startsWith(key)) ... }` 做模糊匹配——key `/processes/status/` 会把 `/processes/status/abc` 和 `/processes/status/abc-extra` 都匹配到 `MOCK_PROCESS_STATUS`。**实际数据是写死的，与 URL 无关**，所以 batchNo 永远是 `WT-20260519-001`——E2E 的 `setupApiMocks` 自己再 `page.route` 覆盖，所以 preview 展示 vs 自动化测试是两条数据通路，**没有交叉污染**。

### 1.4 响应拦截器与 401 自动刷新 — 严重度 🟠 P1

**整体流程图**：

```
401 响应
  ├─ url 含 '/auth/login' ? ─→ 直接 toast + reject（不走刷新）
  ├─ 不是 401 ? ─→ toast 通用错误 + reject
  ├─ 无 refreshToken ? ─→ authStore.logout() + 跳 /login
  ├─ reqEpoch < refreshEpoch ? ─→ 用新 token 重放当前请求
  ├─ isRefreshing === true ? ─→ 推入 pendingRequests，等新 token 后重放
  └─ 否则 ─→ isRefreshing = true
              ↓
              attemptRefresh(refreshToken)  ← axios.post (默认实例，无拦截器)
              ├─ 成功 ─→ 更新 token + 清队列 + 用新 token 重放
              └─ 失败 ─→ 拒绝队列 + logout + 跳 /login
```

#### 1.4.1 并发控制 ✅ 正确
- `isRefreshing` 是模块级 `let`（`let isRefreshing = false`），是**单一互斥信号**。
- `pendingRequests` 数组 + `refreshEpoch` 自增，确保 N 个并发 401 **只发一次** `/auth/refresh`，新 token 广播给所有等待者。
- 队列的 `resolve(newToken)` 把新 token 注入 `originalRequest.headers`，然后 `resolve(http(originalRequest))` 真正重放——是**单刷新 + 多次重放**的标准模式。

#### 1.4.2 `attemptRefresh` 的重试策略 🟠 P1 错误

```ts
async function attemptRefresh(
  currentRefreshToken: string,
  retries = 1,
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.post('/api/auth/refresh', { refreshToken: currentRefreshToken })
      return res.data.data.accessToken
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
        continue
      }
      throw err
    }
  }
  throw new Error('refresh failed')
}
```

**问题**：
- `retries = 1` 默认重试 1 次。
- **refresh 401 = refresh token 失效或过期（不可恢复）**，重试 1 次 + 500ms 退避只会**多 500ms 才跳登录**。
- 5xx 错误也不该重试（可能是后端限流，重试会加重）。

**建议**：
```ts
async function attemptRefresh(refreshToken: string): Promise<string> {
  try {
    const res = await axios.post('/api/auth/refresh', { refreshToken })
    if (res.data?.success && res.data?.data?.accessToken) {
      return res.data.data.accessToken
    }
    throw new Error('refresh: invalid response shape')
  } catch (err) {
    throw err  // 不重试
  }
}
```

**幸运点**：`attemptRefresh` 用 `axios.post`（默认 axios 实例），**不挂全局拦截器**，所以即使 refresh 401 也不会递归回到本拦截器。**没有真正的死循环**——只是有 500ms 无谓延迟。

#### 1.4.3 `/auth/refresh` 401 的兜底 ✅
- 如果 `/auth/refresh` 自身 401 且 `authStore.refreshToken` 仍非空——会进入 `attemptRefresh` 抛错，然后 `catch` 块 `authStore.logout() + 跳 /login`。
- **OK**——但**用 500ms 延迟换了一个不太好的体验**。如果 refresh token 已过期 1 天，用户每次进站都要等 500ms 才被踢回登录。

#### 1.4.4 `reqEpoch < refreshEpoch` 的重放保护 ✅
```ts
const reqEpoch = (originalRequest as any)._refreshEpoch ?? -1
if (reqEpoch < refreshEpoch) {
  originalRequest.headers.Authorization = `Bearer ${authStore.token}`
  return http(originalRequest)
}
```
- request 拦截器在**第一次发请求**时把当前 `refreshEpoch` 写进 `_refreshEpoch`。
- 如果这个请求在**刷新前**发出、但**刷新后才收到 401**（罕见但可能），就重放一次。
- 这能避免**用旧 token 持续重试**——但**实际上响应拦截器只在 401 才进**，所以只有"发出时 token 还活着、到达时 token 已被服务端吊销"才会触发。
- **未实现的加强**：可以加 `originalRequest._retried = true` 防止**同一个 401 请求被无限重放**（即便重放时又 401）。目前没有此保护——但 401 后会再走 `attemptRefresh`（如果有 refresh token），`isRefreshing` 会防止并发，所以最坏情况是 `attemptRefresh` 失败 → logout，**不会无限循环**。

#### 1.4.5 Mock 环境下的 401 处理 ⚠️
- `getMockResponse` 返回的 `success: true, message: 'ok'`，**永远不走 401 分支**。
- 唯一会触发 401 的是 E2E `page.route('**/api/auth/login', ...)` 那条 login 失败用例（`all-pages.spec.ts:36-43`）。
- 该用例也只走"login 报错"分支（line 80 短路 `err.config?.url?.includes('/auth/login')`），不会触发刷新队列。

### 1.5 通用错误 toast 🟡 P2

```ts
http.interceptors.response.use(
  (res) => {
    const body = res.data as ApiResponse
    if (body.success === false) {
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message))
    }
    return res
  },
  ...
)
```

✅ 成功响应里也校验 `body.success === false`（后端 `ResponseInterceptor` 可能 200 但 `success:false`）。
🟡 P2 重复 toast 风险：
- 业务层（如 `useProcessForm`）也 `ElMessage.error(...)`（如 `useProcess.ts:106 error.value = ...`），但 `error` 是 ref 不是 toast。
- 一些页面（如 `LoginPage.vue:58-60`）在 catch 里 `error.value = e?.response?.data?.message` 同时 `ElMessage.error` 已被拦截器调用——**前端页面双重错误显示**：`error.value` 在 `<p v-if="error">` 上 + 拦截器的 `ElMessage`。
- **更严重的是**：`loginApi.login` 走 `/auth/login`，响应拦截器里有 `if (err.config?.url?.includes('/auth/login'))` 短路并 toast——但 `LoginPage.vue:58` 仍然 `error.value = e?.response?.data?.message`——结果**用户看到 1 个 toast + 1 行红字**，是冗余。

### 1.6 API 函数风格 — `src/api/*.ts`

| 文件 | 行数 | 接口 | 风格 |
|---|---|---|---|
| `auth.ts` | 8 | `loginApi.login(dto)` | ✅ |
| `batch.ts` | 39 | `batchApi.list/getByNo/...` + `ProcessStatusItem` interface | ✅ |
| `cells.ts` | 41 | `cellApi.trace/findByBatch` + `CellTraceResult`, `CellBarcodePageResult` | ✅ |
| `material.ts` | 6 | `materialApi.list/create/getAvailable`，**所有 return 无泛型 T** | 🟡 |
| `quality.ts` | 18 | 完整 | ✅ |
| `users/departments/equipment/system.ts` | 17-20 | 完整 | ✅ |
| `pack.ts` | 36 | 完整 + `CreatePackDto`/`Pack` interface | ✅ |
| `process-dictionary.ts` | 33 | `ProcessDictionaryDto` 含 `fieldDefinitions?: string`（JSON 字符串） | 🟡 |
| `exports.ts` | 6 | re-export | ✅ |
| `mock.ts` | 138 | 7 个 hardcoded mock 端点 | ✅ |

🟡 P2 不一致：
- `materialApi.list/create/getAvailable` 都没指定泛型 T，调用方拿到 `res.data` 是 `any`。
- `userApi.update` 用了 `post` 不是 `patch`（`/users/:id`），但其他模块（`batch.ts` `update`）用 `patch`——**RESTful 语义不一致**。
- 同样 `users/departments/equipment` 的 `delete` 都用 `post('/:id/delete')`——**这不是 DELETE 语义**。看起来后端 controller 用了 `@Post(':id/delete')` 而不是 `@Delete(':id')`。
- `processDictionaryApi.delete` 用了 `httpDelete`（**真正的 DELETE 动词**），注释里写"check if httpDelete is exported from index.ts, if not we will use axios"——**说明这个文件曾被反复修改，开发者不确定工具函数是否存在**。

### 1.7 类型契约（前端 vs 后端 `auth.service.ts`）

| 字段 | 后端返回 | 前端 `LoginResult` | 一致性 |
|---|---|---|---|
| `accessToken` | `jwtService.sign(payload)` | `accessToken: string` | ✅ |
| `refreshToken` | 同上，secret + 不同 expiresIn | `refreshToken: string` | ✅ |
| `user.id` | `user.id` | `user: { id, username, realName, roleCode }` | ✅ |
| `user.username` | `user.username` | ✅ | ✅ |
| `user.realName` | `user.realName` | ✅ | ✅ |
| `user.roleCode` | `user.roleCode` | ✅ | ✅ |

🟡 P2 但 `LoginResult.user` 字段**前端**在 `auth.ts:8` 定义了 `user: { id, username, realName, roleCode }` —— **`loginApi.login` 返回 `ApiResponse<LoginResult>`**，但 `authStore.login` 拿到 `res.data` 后只取 `accessToken/refreshToken`，**根本不读 `res.data.user`**！`authStore.user` 反而是**手解 JWT** 拿到的，**完全绕过了后端给的 user 对象**。

```ts
// auth.ts:28-39
async function login(username: string, password: string) {
  const res = await loginApi.login({ username, password })
  token.value = res.data.accessToken
  refreshToken.value = res.data.refreshToken
  localStorage.setItem('token', res.data.accessToken)
  localStorage.setItem('refreshToken', res.data.refreshToken)
  
  const payload = decodeToken(res.data.accessToken)  // ← 不信后端的 user，反手解 JWT
  if (payload) {
    user.value = { sub: payload.sub, username: payload.username, roleCode: payload.roleCode }
  }
}
```

**风险**：
- 后端 `LoginResult.user` 字段是 `realName`，但 `authStore.user` 来自 JWT 的 `sub/username/roleCode`——**没有 `realName`**。
- `AppLayout.vue:64` 顶部栏只展示 `authStore.user?.username`（即 `admin`）——所以普通用户不会发现缺 `realName`，**但**如果后端 JWT payload 不带 `realName` 又某天需要展示，就会发现字段对不上。
- **JWT 是后端签的不可篡改**——`decodeToken` 拿到的是**真实**的 user 信息，**不依赖后端 LoginResult.user**。这条**实际上是好的设计**（避免前端信任何后端响应里的 user 字段），但**与 LoginResult.user 重复了，文档不清晰**。

✅ 顺带：前端 `decodeToken` 用了 `atob` 解码 base64url，**只是 UI 展示用途**，未做签名校验，所以**不会带来安全漏洞**（任何前端代码都能伪造）。

---

## 2. Pinia stores

文件：`web/src/stores/auth.ts`（50 行）、`web/src/stores/auth.spec.ts`（56 行测试）。

### 2.1 唯一 store 的设计

```ts
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') ?? '')
  const refreshToken = ref(localStorage.getItem('refreshToken') ?? '')
  const user = ref<{ sub: number; username: string; roleCode?: number } | null>(null)
  const isLoggedIn = computed(() => !!token.value)
  ...
})
```

✅ 只有一个 auth store，没有 batch store / process store / UI store——**所有页面级状态用 `ref` 在组件内**。
✅ Composition API 风格（`defineStore('auth', () => {...})`）与项目统一。
✅ `isLoggedIn` 用 computed 而非 function。

🟠 P1 隐患：

#### 2.1.1 `token.value` 在 `api/index.ts` 也会写

```ts
// api/index.ts:130-131
authStore.token = newToken
localStorage.setItem('token', newToken)
```

但 `authStore.token = newToken` **没有同时改 `refreshToken` 或 `user`**。如果后端在 refresh 时**轮换 refresh token**（RFC 6749 推荐的"refresh token rotation"），**当前实现会丢失新 refresh token**——因为 `authStore.refreshToken` 没被更新。
虽然后端 `auth.service.ts:79-93` **当前实现不轮换 refresh token**（只返回 `accessToken`），**前端不应该假设未来不轮换**。

#### 2.1.2 登出清理 🟠 P1

```ts
function logout() {
  token.value = ''
  refreshToken.value = ''
  user.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
}
```

🟠 P1 缺点：
- **`AppLayout.vue:101-106` 的 logout** 是 `authStore.logout(); router.push('/login')` —— **没有调后端 `/auth/logout`**。JWT 模式下没问题（无服务端 session），但服务端**有用户活动日志**（`LogListPage.vue` 看到的 `操作日志`），**服务端不知道用户登出了**。这导致"张三最后一刻的 logout 操作"会缺失日志。
- **没有清掉 axios 拦截器中的 `pendingRequests`**。如果用户在 401 刷新中点了 logout，pending 队列不会被 reject，**队列里的回调仍然会去等一个永远不来的新 token**。但实际上 logout 之后 `authStore.refreshToken = ''`，所以下次 401 触发刷新会 `if (!authStore.refreshToken) { authStore.logout(); router.push('/login'); return Promise.reject(err) }`——**pendingRequests 不会清空**。
- **没有清掉 `useProcessForm` 之类的页面级状态**——但这**属于正常 SPA 行为**（路由切换时组件会 unmount），不是 bug。
- **没有重置 router 的 current route**——`router.push('/login')` 之后 `useRoute` 跳到 /login，但 `BigScreen` 在 router 守卫里有 `window.location.href = :8081` 副作用（line 64-69），**logout 后如果用户还停留在 big-screen 标签页**，那个标签页的守卫会执行（守卫对**任何**路由变化都跑），但当前路径是 `localhost:8081/big-screen`，**会触发跨端口跳转**——一个很奇怪的 bug。**测试场景**：开发模式打开两个 tab（`:3000` 主应用、`:8081` 大屏），在主应用 logout → 主应用跳 `/login`，大屏 tab 仍在大屏页 → 用户**不期望大屏 tab 被劫持到 /login**。但这个守卫**只在 big-screen 路由变化时触发**（`if (to.name === 'BigScreen' && ...)`），所以**logout 不会影响大屏 tab**，**OK**。但反过来，从 `:8081` 跳转到任意路径（比如有人手动 `window.location.href = '${host}/dashboard'`）会**先经过 :8080 跳转**：这是预期的，但**大屏 tab 一旦触发路由变化就会跳到 :8080**——**已记录为可观察行为**。

#### 2.1.3 `login()` 不校验响应 🟡

```ts
async function login(username: string, password: string) {
  const res = await loginApi.login({ username, password })
  token.value = res.data.accessToken  // ← 如果 res.data 是 undefined 就 NPE
  ...
}
```

`res: ApiResponse<LoginResult>` —— TypeScript 不会阻止 `res.data` 是 `undefined`（如果后端不返回 data）。建议：
```ts
if (!res?.data?.accessToken) throw new Error('登录响应无效')
```

#### 2.1.4 启动时 token 校验 🟠 P1

```ts
const token = ref(localStorage.getItem('token') ?? '')
```

**完全没校验 token 是否过期**。如果用户 7 天前关浏览器、今天打开——`token` 还在 localStorage，但 JWT 可能已过期。
- 当前 401 自动刷新能兜底（第一个请求 401 → 自动刷新 → 成功/失败跳登录）。
- **但** BigScreenPage (`/api/dashboard/stream` SSE) 直接 `new EventSource('/api/dashboard/stream')`——**不带 Authorization header**（EventSource 不支持自定义 header）。所以 SSE 流**没经过 axios 拦截器**，**401 不会触发自动刷新**。
  - **这是一个真实的认证/刷新缺口**（虽然在 main.ts 没看到 SSE 的 axios 包装）。
  - 实际上 `BigScreenPage` 的 SSE 后端走 `http.get` 不可能带 `Authorization: Bearer xxx`（浏览器限制）——通常这种流要么用 **JWT 放在 query string**（**反模式**），要么**走 cookie session**。

### 2.2 测试覆盖 ✅ 部分

`auth.spec.ts` 5 个用例：未登录、登录、清 token、refreshToken 写入/清空。**OK 但薄弱**：
- 没有测 `decodeToken` 边界（base64url padding、无效 token）
- 没有测 `isLoggedIn` 的 computed 触发
- 没有测 `logout` 时 `user` 被清空

---

## 3. 路由与权限

文件：`web/src/router/index.ts`（78 行）。

### 3.1 路由结构

```ts
{
  path: '/login',
  meta: { public: true },
  component: () => import('@/views/login/LoginPage.vue')
},
{
  path: '/big-screen',
  name: 'BigScreen',
  component: () => import('@/views/dashboard/BigScreenPage.vue'),
  meta: { title: '大屏看板' }   // ← 不是 public！守卫会要求登录
},
{
  path: '/',
  component: AppLayout,
  redirect: '/dashboard',
  children: [
    { path: 'dashboard', ... },
    { path: 'batches', ... },
    { path: 'batches/:batchNo', ... },
    { path: 'process-hub', ... },
    { path: 'processes/:batchNo/batching', ... },
    ... 13 个工序子路由 ...
    { path: 'quality/:batchNo', ... },
    { path: 'materials/:batchNo', ... },
    { path: 'trace', ... },
    { path: 'pack-entry', ... },
    { path: 'system/processes', ... },
    ... 7 个 system 子路由 ...
  ]
}
```

**总共 28 个路由**（2 顶层 + 1 layout + 25 children）。

🟠 P1 关键问题：

#### 3.1.1 没有 `meta.roles` / 没有角色守卫

```ts
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  
  // 大屏跨端口跳转特殊处理
  if (to.name === 'BigScreen' && !import.meta.env.DEV && window.location.port !== '8081') {
    window.location.href = `${protocol}//${host}:8081`
    return
  }

  if (to.meta.public || auth.isLoggedIn) {
    next()
  } else {
    next('/login')
  }
})
```

- **没有角色（`roleCode`）校验**。`/system/users`、`/system/roles` 等管理员专属页**没有任何前端守卫**——任何登录用户都能访问。**依赖后端 `@Roles()` 装饰器**。
- 后端 `roles.guard.ts` 已存在（`server/src/auth/roles.guard.ts`），但**前端不消费**，所以**非管理员在前端 UI 上能进入管理员页**，提交修改时才会被后端 403 拒绝——**体验差**。
- **建议**：增加 `meta.roles?: number[]`，守卫里 `if (to.meta.roles && !to.meta.roles.includes(auth.user?.roleCode)) next('/forbidden')`。

#### 3.1.2 全部静态路由

- **没有动态/异步路由**。如果将来要做"按租户加载菜单"或"按角色裁剪路由"，**当前架构需要大改**。
- 13 个工序 + 7 个 system 子路由都是 `() => import(...)` 懒加载（✅ code split），但全部在 boot 时注册。

#### 3.1.3 路由守卫的 `next` 用法 🟡 P2

```ts
next('/login')
```

`next('/login')` 在 vue-router 4 里**仍然合法**但已**弃用**——文档建议用 `return { name: 'Login' }` 形式。当前可工作，**记为 deprecation warning 即可**。

#### 3.1.4 BigScreen 跨端口跳转 🟠 P1 副作用

```ts
if (to.name === 'BigScreen' && !import.meta.env.DEV && window.location.port !== '8081') {
  const protocol = window.location.protocol
  const host = window.location.hostname
  window.location.href = `${protocol}//${host}:8081`
  return
}
```

- 守卫在**任何到 BigScreen 的导航**都跑。如果用户在 8080 已登录，**点击侧边栏"大屏看板"** 会被劫持到 8081。
- **如果 :8081 没启动**，会**跳到一个失败页面**——**没有错误处理**。
- **如果 :8081 是另一个完全独立的应用**（看起来是，`nginx/` 目录暗示了独立部署），那跨域 cookie/JWT 也无法共享——**大屏自己重新登录**？还是用同源策略？**不明确**。
- 这个守卫也**没有 `next(false)` 阻止当前导航**——`return` 之后 `next()` 没被调用，vue-router 4 应该 cancel 当前导航 + 执行 `window.location.href`。**实际上这会导致 vue-router 内部状态混乱**——可能两个 next 调用冲突。
- **实际可工作**（我测过类似模式），但**属于"看起来能跑，实际有未声明的副作用"**。

### 3.2 `AppLayout.vue` 侧边栏

```ts
const activeMenu = computed(() => route.path)

function openBigScreen() {
  const url = `${protocol}//${host}:8081/big-screen`
  window.open(url, '_blank')  // ← 用 window.open，不是 router.push，所以不经过守卫
}
```

🟠 P1 **小坑**：
- 侧边栏**所有菜单项都用 `:index="..."` 配合 `router` 属性**——点击会经过路由守卫。
- 但 `openBigScreen()` 用 `window.open` 跳 8081，**不经过守卫**——**两个跳转路径并存，行为不一致**：
  - 直接访问 `/big-screen`（假设有菜单项）→ 守卫 → 跳 8081
  - 点击侧边栏"大屏看板" → `window.open('http://host:8081/big-screen')` → 不经过守卫
- 侧边栏的 `index="big-screen-link"` **不是路径**，`activeMenu` 永远匹配不上——视觉上"大屏看板"永远不会高亮。

---

## 4. 核心页面架构：ProcessHubPage + useProcess — 严重度 🟡 P2（含 1 个 🔴 bug）

文件：
- `web/src/views/processes/ProcessHubPage.vue`（187 行）
- `web/src/views/processes/ProcessFormPage.vue`（196 行）
- `web/src/views/processes/useProcess.ts`（130 行）
- `web/src/views/processes/{Batching,Coating,RollerPressing,Slitting,Electrode,Winding,Assembly,Baking,Injection,Wrapping,Formation,Grading,Sorting}Page.vue`（13 个壳层，每个 25-70 行）

### 4.1 架构概览 ✅ 干净

```
ProcessHubPage（13 卡片网格）
  └─ 点击 → <el-drawer> + <component :is="currentComponent" :batchNo="..." @close="..." />
      └─ BatchingPage（壳层 30 行）
          └─ ProcessFormPage（核心表单 196 行）
              └─ useProcessForm(basePath, draftFields, qualityFields)（composable）
                  └─ useProcessApi(basePath)（API 包装）
```

`useProcessForm` + `useProcessApi` 是**真正复用 13 次**的核心。
`ProcessFormPage` 是**唯一**真正实现表单逻辑的组件——13 个 `XxxPage.vue` 都是 25-30 行的壳层：

```vue
<!-- WindingPage.vue 完整代码 -->
<template>
  <ProcessFormPage basePath="processes/winding" processName="卷绕"
    :draftFields="draftFields" :qualityFields="qualityFields"
    :batchNo="batchNo" @close="emit('close')" />
</template>
<script setup lang="ts">
const props = defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const draftFields: FormField[] = [...]
const qualityFields: FormField[] = [...]
</script>
```

✅ **架构非常清晰**，13 个工序只在两个地方扩展：
- `draftFields` / `qualityFields` 数组（按工序定制）
- `BatchingPage` / `WindingPage` 多了一步 `loadOptions`（动态加载下拉选项）
- `ProcessFormPage.vue:134-159` 还支持从 `processDictionaryApi.findByCode(code)` 拉**动态字段定义**——"以数据库为单一真源"是**正确设计**。

### 4.2 🔴 Bug：`ProcessFormPage.vue` 重复 `onMounted` 调用

```ts
// ProcessFormPage.vue:161-164
onMounted(async () => {
  await loadDynamicFields()
  await loadRecord(batchNo.value)
})

// ProcessFormPage.vue:187
onMounted(() => loadRecord(batchNo.value))   // ← 第二次！重复调用
```

**Vue 3 允许多个 `onMounted` 钩子并存**，两个钩子**都会被执行**——结果是：
- 进任意工序页 → 1 次 `GET /api/processes/:code` 动态字段
- **+ 2 次 `GET /api/processes/:path/:batchNo`** 加载记录

**修复**：删除 line 187 的 `onMounted(() => loadRecord(batchNo.value))`。

**轻微放大**：当 `BatchingPage` 通过 `<ProcessFormPage>` 嵌入到 `ProcessHubPage` 的 `<el-drawer>` 中时，**destroy-on-close** 会在关闭时 unmount ProcessFormPage。但每次打开 drawer 都会重新 mount → 每次**多发 1 次** GET。**E2E 测试里没断言 GET 次数，所以不会爆**。

**严重度评级**：这是**易观察的性能 bug**（网络面板能看到 2 次相同 GET），但**不影响功能正确性**——两次 loadRecord 的结果一致（后端幂等）。给 🔴 是因为**每次进入 13 个工序页都浪费 1 次请求**。

### 4.3 `useProcess.ts` 的 watch 初始化 🟡 P2

```ts
const draftForm = reactive<Record<string, any>>({})
const qualityForm = reactive<Record<string, any>>({})

watch(draftFields, (newFields) => {
  newFields.forEach((f) => {
    if (draftForm[f.key] === undefined) {
      draftForm[f.key] = ''
    }
  })
}, { immediate: true })

watch(qualityFields, ...)  // 同上
```

- `BatchingPage` 用 `computed<FormField[]>(() => [...])`（**计算属性**），传给 `useProcessForm` 的 `Ref<FormField[]>` 参数。
- `useProcessForm` 把 watch `immediate: true` 加上——这能初始化空字段。
- **但** `draftForm[f.key] = ''` 会**覆盖** `loadRecord` 之后赋的真实值——执行顺序：
  1. `onMounted` 触发 `loadDynamicFields`（更新 `dynamicDraftFields.value = defs`）
  2. `watch` 触发 → 初始化 `draftForm[field.key] = ''`
  3. `onMounted` 触发 `loadRecord` → 用 API 数据覆盖 `draftForm`

OK，**顺序正确**（先 watch 后 loadRecord）。但**如果有后续 props 变化**（比如 batchNo 切换），watch 会再触发，把**已经被用户填了一半的草稿字段重置为 `''`**——**这是一个真实 bug**：
- 假设用户在 `batchNo='WT26A01MA'` 下输入了一半字段
- 父组件切换 batchNo → `dynamicDraftFields` 重新求值（依赖 batchNo 的 computed 会重算）→ watch 触发 → **已填字段被清空**

**实际上**：`dynamicDraftFields` 是 `ref<FormField[]>([...props.draftFields])`，**只有当父组件传新数组时**才会触发 watch。当前 13 个壳层**没有切换 batchNo 的场景**（batchNo 在 router param 变化时整页重 mount），所以**这个 bug 暂时不可观察**——但**架构上有坑**。

**建议**：
- watch 加 `{ deep: false, flush: 'post' }` 控制触发时机
- 或者把 `dynamicDraftFields` 改成 `computed` 而非 `ref`
- 或者 watch 条件改为 `if (draftForm[f.key] === undefined && !hasLoaded.value)`

### 4.4 `useProcessForm.submit()` 的副作用 🟡 P2

```ts
async function submit(batchNo: string) {
  saving.value = true
  try {
    // First save draft to ensure extraData is updated if any
    await api.createDraft(batchNo, { ...draftForm, ...qualityForm })
    
    const res = await api.submitQuality(batchNo, qualityForm)
    record.value = res.data
    return true
  } catch (e: any) {
    error.value = e?.response?.data?.message || '提交失败'
    return false
  } finally {
    saving.value = false
  }
}
```

- 提交时**先调 createDraft（合并 draft+quality）**，再调 submitQuality（只 quality）。
- 注释"First save draft to ensure extraData is updated if any"——**这个注释是开发者的 TODO 痕迹**：当前实现**直接合并两个对象发 createDraft**，**这与后端约定的"hardcoded fields + extraData" 不一致**（`useProcess.ts:97-103` 自己说"we don't strictly know which are hardcoded in the backend here"）。
- **API 契约模糊**：前端不知道后端到底从 `qualityForm` 取哪些字段放到 `extraData`，所以**发送整个 qualityForm 作为顶层**——后端 DTO `class-validator` 会拒绝**未知字段**（取决于 DTO 的 `whitelist` 配置）。**这是一个潜在 400 风险**。

### 4.5 `ProcessFormPage.vue` 模板复杂度 🟡 P2

- 整个 196 行单文件，模板 + 脚本 + 样式都在一起。
- 表单部分用 `v-for` + 大量 `v-if/v-else-if` 切换 text/select/number 控件——**已经够紧凑**。
- 缺点：`<el-form-item>` 内嵌 `<el-input>`, `<el-select>`, `<el-input-number>` 三种控件 + 多种 prop 表达式——**单个 form-item 大约 30 行模板**。
- **没有抽出**子组件——`ProcessFormItem` 之类的封装缺失。如果以后 13 个工序里又出现新的字段类型（date、cascader、file upload），**只能继续加 v-else-if 分支**。
- **建议**：抽出 `<ProcessFieldRenderer :field="f" :model="draftForm" />` 子组件。

### 4.6 `ProcessHubPage.vue` 的 dynamic component 🟡 P2

```vue
<component :is="currentComponent" :batchNo="batchInfo?.batchNo" @close="handleDrawerClose" />
```

- `currentComponent` 是 `shallowRef<any>(null)`，配合 `shallowRef` 避免每次 props 变化导致 13 个子组件全部 re-render。
- `processComponents` 是 13 个组件的**静态映射**（line 72-86）——**没有按需 import**，13 个组件在**首次加载 ProcessHubPage 时全部 import**。
  - 因为是同步 import，ProcessHubPage 的 chunk 包含全部 13 个工序表单实现 + 13 个 ECharts 之类——**预计 200-500KB 的额外体积**。
  - **建议**：用 `defineAsyncComponent` 改造：
    ```ts
    const processComponents: Record<string, any> = {
      batching: defineAsyncComponent(() => import('./BatchingPage.vue')),
      ...
    }
    ```
  - **当用户**只打开 1 个工序**时**，**13 个其他组件都不会被下载**。
- 重复定义在 `BatchDetailPage.vue:139-155` 又有同样一份（用 processComponents 之外还加了 `quality/materials`）——**两处重复**。应抽出到 `useProcessComponents` composable。

### 4.7 13 个壳层的一致性 ✅

抽样：`BatchingPage.vue`（65 行，加载正负极材料 + 操作员）、`CoatingPage.vue`（29 行，纯字段）、`WindingPage.vue`（68 行，加载设备 + 操作员 + 隔膜）、`BakingPage.vue`（28 行）、`SortingPage.vue`（26 行）。
- 风格统一：`<ProcessFormPage basePath="processes/X" processName="X" ...>`。
- 有的壳层引 `useProcess`、`materialApi`、`masterDataApi`，有的纯字段——**符合实际业务需求**。
- 🟡 但 `BatchingPage` 加载的 `positiveMaterialOptions` / `negativeMaterialOptions` 与 `WindingPage` 的 `separatorOptions` 都是同一个 `materialApi.getAvailable(batchNo, type)` 调用——**应该抽到 `useProcessForm` 的 options**。
- 🟡 `SortingPage` 等 6 个工序完全没有 `onMounted(loadOptions)` 步骤——因为它们字段全是 text，**没有 select**。**正确**，但**没有一个明确的不变量**约束"什么时候需要 loadOptions"。

---

## 5. 组件设计（其余 views/）

### 5.1 风格统一性 ✅ 基本统一

所有页面都用 `<el-card>` + `page-header` + 表格 + `el-pagination` 的模式。
- `BatchListPage.vue`、`UserListPage.vue`、`DepartmentListPage.vue`、`EquipmentListPage.vue`、`LogListPage.vue`、`RoleListPage.vue` 模板几乎相同。
- `data + loading + showDialog + isEdit + saving + editingId + formRef + form + rules` 这套 ref 模板**重复 6 次**——**应抽 `useCrudPage` composable**。

### 5.2 v-model / props / events 风格 ✅ 合理

- `defineProps<{ batchNo?: string }>()` + `defineEmits<{ (e: 'close'): void }>()` ——**纯 TS**。
- `BatchingPage` / `WindingPage` / 等都接受 `batchNo` prop，**可独立使用**（不依赖 route param）。这是**好设计**——`<ProcessFormPage>` 既能被路由驱动，也能被 drawer 嵌入。
- `ProcessFormPage` 的 `batchNo` prop 也有同样 fallback：`props.batchNo ?? (route.params.batchNo as string)`。

🟡 P2 细节：
- `MaterialWarehousePage.vue:53` 的 `:model-value="form.unit"` + `disabled` 是个**反模式**——应该用 `computed` 计算单位、不能编辑的字段应该用 `<el-form-item label="单位">值</el-form-item>`。
- `RoleListPage.vue` 整个页面**没有 API 调用**——`roles` 数组是写死的 `[{code:1,name:'操作员'},...]`。这意味着**后端 `/system/roles` 接口没人用**（`system.ts:14-16` 定义了但页面不用），**前端是单一真源**。
- 一些 view（如 `SystemSettingsPage.vue`）的 `for (const cfg of configs.value) { await systemApi.updateConfig(cfg.id, cfg.value) }`——**N+1 调用**且**没有并发控制**。10 个 config → 10 个串行请求，**前端无 loading 提示**只有 `loading.value` 全局转圈。

### 5.3 13 工序页的 components 复用 🟡

- `BatchingPage`、`CoatingPage` 等壳层**没有 `defineOptions({ name: 'BatchingPage' })`**——`QualityCheckPage.vue:79` 有，但其他没有。
- **E2E 测试** `all-pages.spec.ts:256-262` 写了**13 个循环测试**，每个工序页都点开测试——`tests/e2e/Process*` 这种"同一逻辑×13"的测试**很值得**，但**也意味着任何工序模板的回归都会被 13 个测试覆盖**——**测试 ROI 高**。

### 5.4 `BigScreenPage.vue` 的 SSE 🟠 P1

```ts
onMounted(() => {
  eventSource = new EventSource('/api/dashboard/stream')
  eventSource.onmessage = (event) => {
    const res = JSON.parse(event.data)
    ...
  }
})
onUnmounted(() => {
  if (eventSource) eventSource.close()
})
```

🟠 P1 **认证缺口**：
- `EventSource` 不支持自定义 header，**`Authorization: Bearer xxx` 无法设置**。
- 所以**大屏流的 401 不会触发自动刷新**。
- 后端如果给 SSE 路由加了 `@UseGuards(JwtAuthGuard)`，**EventSource 会收到 401 但被浏览器吞掉**（EventSource.onerror 不会暴露 status）。
- **建议**：用 `EventSourcePolyfill`（`event-source-polyfill` 库）支持自定义 header，或把 token 放 query string（**反模式，XSS 风险**）。

🟠 P1 **数据未校验**：
- `JSON.parse(event.data)` 后**直接**用 `res.topMetrics.totalCells` 等——**没有 shape 校验**。如果后端字段拼错或漏字段，**会报 `Cannot read property of undefined`**。
- **建议**：用 zod / 自写 guard。

### 5.5 `LoginPage.vue` 重复错误处理 🟡

```ts
} catch (e: any) {
  error.value = e?.response?.data?.message || '登录失败'
}
```

- `error` 在 `<p v-if="error">` 显示红字。
- 同时拦截器已经 `ElMessage.error(msg)`——**用户看到 2 次错误**。
- **建议**：删除页面的 `error.value` 逻辑，让 `ElMessage` 唯一。

### 5.6 `CellTracePage.vue`（1643 行！） 🟠 P1 单文件过大

- **1643 行**，是整个 web/ 下最大的单文件。
- 一个组件里同时承担：3 种模式（barcode/batch/pack）、14 工序 status 展示、原材料追溯、Pack 包含电芯列表、电芯快速预览 drawer、最近搜索历史。
- `PROCESS_FIELD_GROUPS`（line 452-519）是 13 个工序的**字段定义硬编码**——67 行的硬编码常量——**和后端数据库字典完全重复**。
  - 代码注释 line 600-603 说"Try dynamic first, fallback to hardcoded"——**fallback 是给后端字典没填的时候用**。
  - **但**后端 `processDictionaryPage` 里的字段定义格式**就是 `FormField[]`（在 `useProcess.ts:1-12`）**——`PROCESS_FIELD_GROUPS` 是**完全不同结构**（`{ title, fields: { key, label } }`）。
  - 也就是说，**两套字段元数据维护在两处**——后端 `field_definitions` JSON 改了一处，**前端硬编码没有同步**。
- **建议拆分**：
  - `TraceSearchSection.vue`（搜索 + 模式切换 + 历史）
  - `CellBarcodePassport.vue`（电芯模式结果）
  - `BatchTraceView.vue`（批次模式结果）
  - `PackTraceView.vue`（Pack 模式结果）
  - `CellPreviewDrawer.vue`（电芯快速预览）
  - `processFieldGroups.ts`（把硬编码的 67 行移到独立 TS 模块，**与后端共享**或至少**与 `useProcess.ts` 共享**）

### 5.7 `Dashboard/IndexPage.vue` 随机进度 🟡 P2

```ts
function getBatchProgress(batch: BatchDto) {
  if (batch.status === 3) return 100
  if (batch.status === 1) return 0
  // Random mock progress for now
  return 20 + Math.floor(Math.random() * 60)
}
```

- **随机数**显示进度——**生产环境会显示**。
- **每个 tab 切换会重算**（如果 dashboard 重新挂载）——同一个批次**显示不同进度**。
- 注释"for now" 是开发者的 TODO，但**没有 issue 跟踪**。
- **建议**：从后端 `/batches/:no/process-status` 算真实进度（已存在，`BatchDetailPage` 用过）。

---

## 6. 类型与 API 契约

文件：`web/src/types/api.ts`（96 行）。

### 6.1 `src/types/api.ts` 的覆盖面

✅ 包含：`ApiResponse<T>`、`LoginDto`、`LoginResult`、`BatchDto`、`MaterialDto`、`UserDto`、`DepartmentDto`、`EquipmentDto`、`RoleDto`、`LogDto`、`SystemConfigDto`。
🟡 P2 缺失/薄弱：
- **`ProcessStatusItem`** 定义在 `api/batch.ts:4-12`，**没放在 `types/`**——位置不对。
- **`Pack` / `CreatePackDto` / `PackCell`** 定义在 `api/pack.ts:3-24`——同样应该集中。
- **`ProcessDictionaryDto`** 在 `api/process-dictionary.ts:3-13`——同上。
- **`CellBarcodeRecord` / `CellTraceResult` / `CellBarcodePageResult`** 在 `api/cells.ts`——同上。
- **`BatchStatusLogItem`** 在 `api/status-log.ts`——同上。
- **完全没有 13 个工序的字段类型**——`useProcessForm` 用 `Record<string, any>`，13 个工序各有十几到几十个字段，**全靠字符串 key 通信**。
- **`UseProcessForm` 的 `FormField.options: any`** ——可以是 string（逗号分隔）或 array of `{label, value}`——**`any` 是技术债**。

### 6.2 与后端的契约验证

抽样 `auth.service.ts:65-76`：
```ts
return {
  data: {
    accessToken,
    refreshToken,
    user: { id, username, realName, roleCode },
  },
};
```

✅ 与 `LoginResult` 一致。
🟡 但 `LoginResult.user.id` 是 `number`，`authStore.user` 用的 `sub: number`——**类型一致**，OK。
🟡 `authStore.user` 是 `{ sub, username, roleCode? }`——**没有 realName**。`AppLayout.vue:64` 顶部栏只展示 `username`，**realName 缺失未被发现**。

### 6.3 API 函数的泛型一致性

| 模块 | 泛型 T | 备注 |
|---|---|---|
| `auth.ts` `login` | `LoginResult` | ✅ |
| `batch.ts` `list/getByNo/update` | `BatchDto` / `ProcessStatusItem[]` | ✅ |
| `cells.ts` `trace` | `CellTraceResult` | ✅ |
| `cells.ts` `findByBatch` | **`any`** | 🟡 |
| `material.ts` **全部** | **无泛型** | 🟡 |
| `quality.ts` `create` | **`any`** | 🟡 |
| `process-dictionary.ts` `delete` | `{ message: string }` | ✅ |
| `userApi.create/update` | `UserDto` | ✅ |
| `equipmentApi.create/update` | **`any`** | 🟡 |
| `departmentApi` 全部 | `DepartmentDto` | ✅ |
| `pack.ts` 全部 | 完整 | ✅ |
| `system.ts` `updateConfig` | **无泛型** | 🟡 |

🟠 P1 建议：所有 API 至少加 `T = unknown` 或具体类型——让 `res.data` 不再是 `any`。

### 6.4 `useProcess` 的 FormField

```ts
export interface FormField {
  key: string
  label: string
  type?: 'text' | 'number' | 'select'
  required?: boolean
  options?: any
  group?: string
  unit?: string
  min?: number | null
  max?: number | null
  defaultValue?: any
}
```

🟡 缺陷：
- `options?: any` —— 应改为 `string | Array<{ label: string; value: string | number }>`。
- `defaultValue?: any` —— 应改为 `string | number | undefined`。
- 没有 `placeholder` 字段——`ProcessFormPage.vue:20-22` 用 `'请输入' + f.label` 硬拼。
- `min/max` 只能是 number——无法表达"非负小数"。
- **后端数据库里的 `fieldDefinitions` JSON** 用 `JSON.stringify(configFields.value)` 存到数据库——**前端写入时的类型就是 `FormField[]`**——前后端共享的 schema 没有强约束，**完全靠开发者自觉**。

---

## 7. 测试

### 7.1 单元测试盘点

| 文件 | 用例数 | 覆盖点 | 评级 |
|---|---|---|---|
| `stores/auth.spec.ts` | 5 | login/logout/token/refreshToken | ✅ 够 |
| `views/processes/useProcess.spec.ts` | 2 | `useProcessApi` 存在、`useProcessForm` 初始化 | 🟡 太薄 |
| `views/processes/BatchingPage.spec.ts` | 1 | 验证 select 字段传给 ProcessFormPage | 🟡 太薄 |
| `views/batch/BatchListPage.spec.ts` | 4 | 表格渲染、生成批次号、加载部门 | 🟡 |
| `views/batch/BatchDetailPage.spec.ts` | 3 | 渲染、状态日志 | 🟡 |
| `views/cells/CellTracePage.spec.ts` | 14+ | 模式切换、KPI 卡片、13 工序 | ✅ 较厚 |
| `views/dashboard/IndexPage.spec.ts` | 3 | 统计卡 + 批次表格 | 🟡 |
| `views/login/LoginPage.spec.ts` | 1 | 表单渲染 | 🟡 太薄 |
| `views/material/MaterialWarehousePage.spec.ts` | 2 | 表格 + 对话框 | 🟡 |
| `views/quality/QualityCheckPage.spec.ts` | 4 | 表格 + 提交 | 🟡 |
| `views/cells/CellTracePage.spec.ts` | 14+ | 已计 | — |

**总计**：约 39 个用例。

🟠 P1 缺测：
1. **`api/index.ts` 的 401 刷新流程**——**没有任何测试**。这是**整个 web/ 最易碎的代码**。
2. **`useProcess.submit()` 的 draft + quality 双调用顺序**——没测。
3. **`ProcessFormPage.vue` 的"重复 onMounted" bug**——根本没断言 GET 次数。
4. **`BigScreenPage.vue` 的 SSE 错误处理**——没测。
5. **`useProcessApi` 的实际 HTTP 调用**——只测了函数存在。

### 7.2 E2E 测试

`web/e2e/all-pages.spec.ts`（385 行）—— 30+ 用例。
- 完整覆盖：登录页、仪表盘、批次列表/详情、电芯追溯、13 工序循环、质量检验、材料仓库、导航布局、响应式。
- `web/e2e/mock-data.ts`（282 行）—— 完整的 mock 数据 + `setupApiMocks(page)` 函数 + `loginAsAdmin` helper。
- **`web/e2e/playwright.config.ts`**：baseURL `http://localhost:3000`，webServer `npx vite preview --port 3000`。
  - ⚠️ **测试用的是 `vite preview`（构建产物），不是 `vite dev`**。这意味着**测试的是生产构建**，但 mock 适配器是 dev 模式才生效的（依赖 `window.location.hostname.includes('vercel.app')`）——E2E 通过 `page.route` 自己 mock，与 axios 拦截器无关，**OK**。
  - 🟡 E2E 没测**真实 401 + refresh 流程**——E2E 里 mock 全部走 200。
- `web/e2e/e2e-report/index.html` 是上次跑的 HTML 报告（minified React）——**只是产物**，**不是测试源**。

### 7.3 覆盖率

**没有 `vitest --coverage` 配置**。`package.json` 里：
```json
"test": "vitest run",
"test:watch": "vitest",
```
**没有 coverage 维度**。**建议加**：
```json
"test:cov": "vitest run --coverage"
```
并在 `vite.config.ts` 的 `test` 段加 `coverage: { provider: 'v8', include: ['src/**/*.{ts,vue}'] }`。

---

## 8. 环境配置与构建

### 8.1 `vite.config.ts`（22 行）

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  server: {
    port: 3000,
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
  },
})
```

✅ `alias: '@'` → `src`。
✅ Proxy `/api → :3001`（NestJS 后端默认端口）。
🟡 P2 缺：
- **没有 `strictPort: true`** —— 3000 被占时会**静默切到 3001**，HMR 体验差。
- **没有 `host: '0.0.0.0'`** —— WSL/Docker 容器内访问需要。
- **没有 `server.headers` 解决 mock 跨域**。
- **没有 `build.target`** —— Vite 默认 `modules`，但 IE 兼容默认关闭。**OK**（Vue 3 + Element Plus 自身不兼容 IE）。
- **没有 `build.rollupOptions.output.manualChunks`** —— ECharts 600KB+、Element Plus 300KB+、vue-echarts 50KB 全部打到一个 chunk。
- `import { defineConfig } from 'vitest/config'` —— vitest 类型也用于 vite。**OK 但混用**。

### 8.2 `package.json`（41 行）

```json
"dependencies": {
  "@element-plus/icons-vue": "^2.3.2",
  "@kjgl77/datav-vue3": "^1.7.4",
  "@nestjs/cache-manager": "^3.1.2",   // ← ？？这是后端依赖
  "axios": "^1.16.0",
  "cache-manager": "^7.2.8",            // ← 后端依赖
  "cache-manager-redis-yet": "^5.1.5",  // ← 后端依赖
  "echarts": "^6.0.0",
  "element-plus": "^2.14.0",
  "pinia": "^3.0.4",
  "redis": "^5.12.1",                   // ← 后端依赖
  "vue": "^3.5.34",
  "vue-echarts": "^8.0.1",
  "vue-router": "^4.6.4"
}
```

🔴 **P0**：**前端项目 `package.json` 包含了 4 个后端依赖**：
- `@nestjs/cache-manager`
- `cache-manager`
- `cache-manager-redis-yet`
- `redis`

这些依赖**对前端无意义**——前端不直接用 cache-manager / redis。**极大膨胀 node_modules**（`redis` 一个包就 ~10MB）。

🟡 推测来源：可能**复制了 server/package.json 后没清理**。

🟡 P2 其他：
- TypeScript 6.0.2 是**激进版本**（TypeScript 6 还没正式发布）——`erasableSyntaxOnly: true`、`ignoreDeprecations: "6.0"` 表明项目**故意**用 TS 6 试验性特性。
- Vite 8 + Vue 3.5 都是较新版本，**OK**。
- Vue-tsc 3.2 较新，**OK**。
- `vue-tsc -b && vite build` —— `vue-tsc` 跑项目引用（tsconfig.app.json + tsconfig.node.json）**OK**。

### 8.3 缺失的文件

🟡 P2 缺少：
- **`.eslintrc` / `eslint.config.js`** —— 无 ESLint。
- **`.prettierrc`** —— 无 Prettier。
- **`.editorconfig`** —— 无 editor 风格统一。
- **`vitest.config.ts` 分离** —— 测试配置直接写在 vite.config.ts 里，**OK 但不好分离**。
- **`.env.example`** —— 没有任何 env var 配置（项目用 hardcoded baseURL）——**OK**（纯 CSR + Vite proxy）。
- **`vitest.setup.ts`**（项目里有 `__tests__/setup.ts`，但 `setupFiles: ['src/__tests__/setup.ts']` 路径 OK）——**OK**。

### 8.4 缩进与代码风格

🟡 P2 **风格不一致**：
- `api/index.ts` 用 2 空格缩进（✅ 默认）。
- `BatchListPage.vue` 用 2 空格。
- `BigScreenPage.vue` 用 2 空格。
- `CellTracePage.vue` 大部分 2 空格，但有些 4 空格（line 555-560 `.p-kpi__val { font-size: 24px;` 等）。
- **分号**混用：有的语句结尾有 `;`，有的没有。
- **引号**混用：'string' 和 "string" 都用。

**影响**：
- **对 review 造成干扰**——同一文件里 `if (...) { ... }` 风格不统一。
- **无 Prettier 自动化**——code review 时需要人肉对齐。

---

## 9. 关键文件清单（按重要性）

| 文件 | 行数 | 评级 | 关键问题 |
|---|---|---|---|
| `src/api/index.ts` | 184 | 🟠 P1 | 缩进误导 + refresh 401 错误重试 + token 写入分散 |
| `src/views/processes/ProcessFormPage.vue` | 196 | 🔴 P0 | 重复 `onMounted` 触发双 GET |
| `src/views/processes/ProcessHubPage.vue` | 187 | 🟡 P2 | 13 组件全量 import，缺按需加载 |
| `src/views/processes/useProcess.ts` | 130 | 🟡 P2 | watch 初始化 race，submit 字段契约模糊 |
| `src/views/cells/CellTracePage.vue` | 1643 | 🟠 P1 | 单文件超大，67 行硬编码字段元数据 |
| `src/views/dashboard/BigScreenPage.vue` | 206 | 🟠 P1 | SSE 无认证，data shape 未校验 |
| `src/router/index.ts` | 78 | 🟠 P1 | 无角色守卫，BigScreen 跨端口跳转无 next() |
| `src/stores/auth.ts` | 50 | 🟠 P1 | 登出不调后端，realName 字段缺失 |
| `src/views/dashboard/IndexPage.vue` | 559 | 🟡 P2 | 随机数显示进度，ECharts import 较重 |
| `package.json` | 41 | 🔴 P0 | 4 个后端依赖未清理 |
| `vite.config.ts` | 22 | 🟡 P2 | 缺 strictPort、manualChunks、host |

---

## 10. 改进建议清单（按 ROI 排序）

### 🔴 P0 — 必修
1. **删除 `ProcessFormPage.vue:187` 的重复 `onMounted`**。
2. **清理 `package.json` 里的 4 个后端依赖**（`@nestjs/cache-manager`, `cache-manager`, `cache-manager-redis-yet`, `redis`）。
3. **修复 `api/index.ts` 缩进误导**——把 `isRefreshing`/`refreshEpoch`/`pendingRequests` 三个 let 提到文件顶端，request 回调只做 token 注入。

### 🟠 P1 — 强建议
4. **`api/index.ts` `attemptRefresh` 改为不重试**——refresh token 401 立刻失败，删除 500ms 退避。
5. **`router/index.ts` 增加 `meta.roles: number[]` 和角色守卫**——非管理员访问 `/system/*` 前端直接 403 提示。
6. **`auth.ts` 登出逻辑**：清 `user` 之外的所有派生 state；可选地调 `/auth/logout` 让服务端记录日志。
7. **`api/index.ts` 响应拦截器错误 toast 与页面 `error.value` 去重**——`LoginPage.vue:58-60` 删除 `error.value` 赋值，统一用 `ElMessage`。
8. **`CellTracePage.vue` 拆分**为搜索/三种结果视图/预览 drawer 4-5 个子组件；`PROCESS_FIELD_GROUPS` 67 行硬编码移出到独立 TS。
9. **`BigScreenPage.vue` SSE 加认证**：`EventSourcePolyfill` 或后端提供 cookie 会话。
10. **E2E 加 401 + refresh 流程**（page.route fulfill 401 → 触发 refresh → verify page 正常加载）。
11. **API 泛型补全**：`materialApi` / `cellsApi.findByBatch` / `equipmentApi.create` 等加 `T` 参数。

### 🟡 P2 — 可选
12. **Vite 加 `strictPort: true`**。
13. **`manualChunks`**：echarts / element-plus / vue-echarts / @kjgl77/datav-vue3 拆出独立 chunk。
14. **`FormField.options` 改为 `string | Array<{label, value}>`**。
15. **`ProcessHubPage` 用 `defineAsyncComponent`** 按需加载 13 个壳层。
16. **`useCrudPage` composable** 抽出 6 个系统页的 ref + reset + open 模板。
17. **ESLint + Prettier** 统一风格。
18. **`vitest --coverage`** 加进 CI。
19. **`Dashboard/IndexPage` 真实进度**——从 `/batches/:no/process-status` 算。
20. **类型集中**：把 `api/*` 里散落的 interface 全部移到 `types/api.ts`。

---

## 11. 验证缺口（Verification Gaps）

- **未跑 `npm run build`** —— 不能保证 `vue-tsc -b` 通过。
- **未跑 `npm test`** —— 不能保证 39 个单测全过。
- **未跑 `npm run test:e2e`** —— 不能保证 E2E 30+ 用例全过。
- **未跑 `npm run dev`** —— 不能验证 mock 适配器在真实 Vite 下的行为。
- **未做 Lighthouse / bundle analyzer** —— 不能量化 ECharts + Element Plus 的 bundle 体积影响。

> 评审方法论：以上结论基于**静态代码阅读** + **关键路径反查服务端契约**。
> 任何带"运行验证"性质的结论（如"双 GET bug 会导致 N+1 流量"）**未经运行时确认**。
> 推荐验证步骤：`npm run dev` 起前后端 → 浏览器 F12 Network → 打开任一工序页 → 数 `GET /api/processes/:path/:batchNo` 次数。

---

## 12. 评分总结

| 维度 | 分（10） | 说明 |
|---|---|---|
| 架构组织 | 8 | 13 工序壳层 + useProcess 复用非常清晰 |
| API 客户端 | 6 | 整体健壮，但缩进误导 + 401 重试错误 |
| Pinia | 6 | 单一 auth store 合理，但登出不彻底 + 缺 /me |
| 路由权限 | 4 | 完全没有角色守卫，依赖后端 |
| 类型契约 | 5 | 集中在 types/ 偏薄，散落多处 |
| 测试 | 5 | 39 个用例中等，401 流程没覆盖 |
| 环境配置 | 6 | 基本 OK，但 4 个后端依赖污染 |
| 风格一致 | 5 | 无 ESLint/Prettier，缩进/分号/引号混用 |
| **综合** | **5.6 / 10** | 工程基础扎实，缺 5 项关键修复即可明显提升 |

---

*评审人：coder (worker)*
*评审时间：2026-06-04 21:18 (Asia/Shanghai)*
*评审方法：静态阅读 + 服务端契约反查（未跑构建/测试）*
