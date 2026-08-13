# 角色管理（新增/删除角色）Implementation Plan
 
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
 
**Goal:** 在“角色管理”页面开放新增角色、删除角色能力，并让“用户管理”的角色显示/下拉同步基于角色字典（不改变现有鉴权规则：仅 `roleCode=4` 为管理员）。
 
**Architecture:** 后端新增 `sys_role` 角色字典表与对应 CRUD 接口（仅管理员可新增/删除）；前端角色管理页改为调用接口并提供弹窗表单；用户管理页角色映射与下拉改为动态获取。为避免某些环境未跑 migration 导致页面不可用，`GET /system/roles` 增加“表不存在/查询失败 → fallback 静态 1~4”兼容层。
 
**Tech Stack:** NestJS、TypeORM、SQL Server、Vue3、Element Plus
 
---
 
## Files Overview
 
**Server**
- Create: `d:/traecode/YT-mes/server/src/system/entities/role.entity.ts`
- Create: `d:/traecode/YT-mes/server/src/system/dto/create-role.dto.ts`
- Modify: `d:/traecode/YT-mes/server/src/system/system.module.ts`
- Modify: `d:/traecode/YT-mes/server/src/system/system.service.ts`
- Modify: `d:/traecode/YT-mes/server/src/system/system.controller.ts`
- Create: `d:/traecode/YT-mes/server/src/migrations/1781900000000-CreateSysRole.ts`
 
**Web**
- Modify: `d:/traecode/YT-mes/web/src/types/api.ts`
- Modify: `d:/traecode/YT-mes/web/src/api/system.ts`
- Modify: `d:/traecode/YT-mes/web/src/views/system/RoleListPage.vue`
- Modify: `d:/traecode/YT-mes/web/src/views/system/UserListPage.vue`
- Modify (optional but recommended): `d:/traecode/YT-mes/web/src/api/mock.ts`
 
---
 
### Task 1: 新增角色表 `sys_role`（TypeORM Migration）
 
**Files:**
- Create: `d:/traecode/YT-mes/server/src/migrations/1781900000000-CreateSysRole.ts`
 
- [ ] **Step 1: 写 migration（创建表 + 初始化 1~4 系统角色）**
 
```ts
import { MigrationInterface, QueryRunner } from "typeorm";
 
export class CreateSysRole1781900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sys_role')
      CREATE TABLE sys_role (
        code        INT             NOT NULL PRIMARY KEY,
        name        NVARCHAR(50)    NOT NULL UNIQUE,
        description NVARCHAR(200)   NULL,
        is_system   BIT             NOT NULL DEFAULT 0,
        created_at  DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_at  DATETIME2       NOT NULL DEFAULT GETDATE()
      )
    `);
 
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys_role WHERE code = 1)
      INSERT INTO sys_role (code, name, description, is_system)
      VALUES (1, N'操作员', N'生产线操作，工序录入', 1)
    `);
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys_role WHERE code = 2)
      INSERT INTO sys_role (code, name, description, is_system)
      VALUES (2, N'质检员', N'质量控制，巡检检验', 1)
    `);
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys_role WHERE code = 3)
      INSERT INTO sys_role (code, name, description, is_system)
      VALUES (3, N'仓管员', N'仓库管理，物料出入库', 1)
    `);
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys_role WHERE code = 4)
      INSERT INTO sys_role (code, name, description, is_system)
      VALUES (4, N'管理员', N'系统管理员，拥有全部权限', 1)
    `);
  }
 
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`IF OBJECT_ID('sys_role', 'U') IS NOT NULL DROP TABLE sys_role`);
  }
}
```
 
- [ ] **Step 2: 运行 migration**
 
Run (示例，按项目实际脚本为准): `cd server && npm run migration:run`
Expected: 输出包含新 migration 的执行日志，且数据库出现 `sys_role` 表与 4 条初始化数据
 
---
 
### Task 2: 后端领域层（Entity + DTO + Service）
 
**Files:**
- Create: `d:/traecode/YT-mes/server/src/system/entities/role.entity.ts`
- Create: `d:/traecode/YT-mes/server/src/system/dto/create-role.dto.ts`
- Modify: `d:/traecode/YT-mes/server/src/system/system.module.ts`
- Modify: `d:/traecode/YT-mes/server/src/system/system.service.ts`
 
- [ ] **Step 1: 新增 Entity**
 
```ts
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
 
@Entity('sys_role')
export class SystemRole {
  @PrimaryColumn({ name: 'code', type: 'int' })
  code: number;
 
  @Column({ name: 'name', type: 'nvarchar', length: 50, unique: true })
  name: string;
 
  @Column({ name: 'description', type: 'nvarchar', length: 200, nullable: true })
  description: string | null;
 
  @Column({ name: 'is_system', type: 'bit', default: false })
  isSystem: boolean;
 
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
 
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```
 
- [ ] **Step 2: 新增 CreateRoleDto**
 
```ts
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
 
export class CreateRoleDto {
  @IsInt()
  @Min(5)
  code: number;
 
  @IsString()
  @IsNotEmpty({ message: '角色名称不能为空' })
  @MaxLength(50)
  name: string;
 
  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;
}
```
 
- [ ] **Step 3: 在 SystemModule 注入 repository**
 
在 `TypeOrmModule.forFeature([...])` 增加 `SystemRole`。
 
- [ ] **Step 4: 在 SystemService 增加角色方法**
 
实现：
 
```ts
private fallbackRoles() {
  return [
    { code: 1, name: '操作员', description: '生产线操作，工序录入', isSystem: true },
    { code: 2, name: '质检员', description: '质量控制，巡检检验', isSystem: true },
    { code: 3, name: '仓管员', description: '仓库管理，物料出入库', isSystem: true },
    { code: 4, name: '管理员', description: '系统管理员，拥有全部权限', isSystem: true },
  ];
}
 
async listRoles() {
  try {
    const items = await this.roleRepo.find({ order: { code: 'ASC' } });
    return { data: items };
  } catch {
    return { data: this.fallbackRoles() };
  }
}
 
async createRole(dto: CreateRoleDto) {
  const existsByCode = await this.roleRepo.findOne({ where: { code: dto.code } });
  if (existsByCode) throw new BadRequestException('角色代码已存在');
 
  const existsByName = await this.roleRepo.findOne({ where: { name: dto.name } });
  if (existsByName) throw new BadRequestException('角色名称已存在');
 
  const role = this.roleRepo.create({
    code: dto.code,
    name: dto.name,
    description: dto.description?.trim() || null,
    isSystem: false,
  });
  await this.roleRepo.save(role);
  return { data: role, message: '角色创建成功' };
}
 
async deleteRole(code: number) {
  const role = await this.roleRepo.findOne({ where: { code } });
  if (!role) throw new NotFoundException('角色不存在');
  if (role.isSystem) throw new BadRequestException('系统内置角色不允许删除');
 
  const userCount = await this.userRepo.count({ where: { roleCode: code } });
  if (userCount > 0) throw new BadRequestException('该角色已分配给用户，禁止删除');
 
  await this.roleRepo.delete({ code });
  return { message: '角色删除成功' };
}
```
 
其中 `userRepo` 直接注入 `User` 实体的 repository（只用于 count 校验）。
 
---
 
### Task 3: 后端 Controller 开放接口（管理员新增/删除）
 
**Files:**
- Modify: `d:/traecode/YT-mes/server/src/system/system.controller.ts`
 
- [ ] **Step 1: GET /system/roles 改为读数据库**
 
`getRoles()` 调用 `systemService.listRoles()`。
 
- [ ] **Step 2: 新增 POST /system/roles（管理员）**
 
```ts
@Post('roles')
@Roles(UserRole.ADMIN)
async createRole(@Body() dto: CreateRoleDto) {
  return this.systemService.createRole(dto);
}
```
 
- [ ] **Step 3: 新增 POST /system/roles/:code/delete（管理员）**
 
```ts
@Post('roles/:code/delete')
@Roles(UserRole.ADMIN)
async deleteRole(@Param('code') code: number) {
  return this.systemService.deleteRole(Number(code));
}
```
 
- [ ] **Step 4: 基础接口自测（curl 或 Postman）**
 
Run:
- `GET /api/system/roles` 应返回 `data: [{code,name,description,isSystem,...}]`
- `POST /api/system/roles`（管理员 token）应创建成功
- `POST /api/system/roles/:code/delete`（管理员 token）应删除成功/或触发约束报错
 
---
 
### Task 4: 前端 API & Types 同步
 
**Files:**
- Modify: `d:/traecode/YT-mes/web/src/types/api.ts`
- Modify: `d:/traecode/YT-mes/web/src/api/system.ts`
 
- [ ] **Step 1: 扩展 RoleDto**
 
```ts
export interface RoleDto {
  code: number
  name: string
  description?: string | null
  isSystem?: boolean
}
```
 
- [ ] **Step 2: 扩展 systemApi**
 
```ts
import { get, post } from './index'
import type { RoleDto } from '@/types/api'
 
roles() {
  return get<RoleDto[]>('/system/roles')
},
createRole(data: { code: number; name: string; description?: string }) {
  return post<RoleDto>('/system/roles', data)
},
deleteRole(code: number) {
  return post(`/system/roles/${code}/delete`)
},
```
 
---
 
### Task 5: 角色管理页（新增/删除 + 列表改为 API）
 
**Files:**
- Modify: `d:/traecode/YT-mes/web/src/views/system/RoleListPage.vue`
 
- [ ] **Step 1: 列表改为 loadData() 调用 systemApi.roles**
- [ ] **Step 2: 新增“新增角色”按钮 + 弹窗表单（code/name/说明）**
  - code 校验：必填、数字、`>=5`
  - name 校验：必填
- [ ] **Step 3: 表格增加“操作”列**
  - 系统角色（isSystem）禁用删除按钮
  - 删除使用 `el-popconfirm`
- [ ] **Step 4: 保存/删除成功后 reload 列表并提示**
 
---
 
### Task 6: 用户管理页角色下拉与显示改为动态角色字典
 
**Files:**
- Modify: `d:/traecode/YT-mes/web/src/views/system/UserListPage.vue`
 
- [ ] **Step 1: 移除硬编码 roleMap / roleOptions**
- [ ] **Step 2: onMounted 时先拉取角色字典**
  - `const roles = ref<RoleDto[]>([])`
  - `const roleMap = computed(() => Object.fromEntries(roles.value.map(r => [r.code, r.name])))`
  - `const roleOptions = computed(() => roles.value.map(r => ({ code: r.code, name: r.name })))`
- [ ] **Step 3: 角色 Tag 显示使用 roleMap（未知则显示“未知”）**
- [ ] **Step 4: 新增用户时默认 roleCode 取第一个可用角色或 1**
 
---
 
### Task 7: 预览环境 Mock 支持（按 method+url 区分）
 
**Files:**
- Modify: `d:/traecode/YT-mes/web/src/api/mock.ts`
 
- [ ] **Step 1: getMockResponse 支持 method+url 精确匹配**
 
实现匹配顺序：
1) `const key = \`\${(config.method || 'get').toUpperCase()} \${url}\`; if (mockData[key]) return mockData[key]`
2) fallback 到旧的 `mockData[url]`
3) startsWith 模糊匹配同样先尝试 method+url 再尝试 url
 
- [ ] **Step 2: 补充 mockData**
 
增加：
- `GET /system/roles`
- `POST /system/roles`
- `POST /system/roles/5/delete`（用 startsWith 或精确路径均可）
 
---
 
### Task 8: 验证
 
- [ ] **Step 1: Server typecheck / test**
 
Run (示例，按项目实际脚本为准):
- `cd server && npm test`
- `cd server && npm run build`
 
- [ ] **Step 2: Web typecheck / build**
 
Run (示例，按项目实际脚本为准):
- `cd web && npm run build`
 
- [ ] **Step 3: 手工验证流程**
  - 进入“系统管理 → 角色管理”：能新增角色、删除角色
  - 进入“系统管理 → 用户管理”：新增用户时下拉包含新增角色；列表展示角色名称正确
  - 删除角色时：若已分配给用户则提示禁止删除
  - 某环境未跑 migration 时：角色/用户页面仍可打开并展示 1~4 静态角色（接口返回 fallback）
 
