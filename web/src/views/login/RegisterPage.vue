<template>
  <div class="register-container">
    <div class="register-card">
      <h2 class="register-title">YT-MES</h2>
      <p class="register-subtitle">注册新账号</p>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" @submit.prevent="handleRegister">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="4~50 位字母或数字" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="真实姓名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="最少 6 位" :prefix-icon="Lock" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入密码" />
        </el-form-item>
        <el-form-item label="角色" prop="roleCode">
          <el-select v-model="form.roleCode" style="width: 100%">
            <el-option
              v-for="r in roleOptions"
              :key="r.code"
              :label="r.name"
              :value="r.code"
              :disabled="r.code === 4"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="选填" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" :loading="submitting" native-type="submit">
            {{ submitting ? '注册中...' : '注 册' }}
          </el-button>
        </el-form-item>
      </el-form>
      <p class="register-footer">
        已有账号？
        <router-link to="/login">立即登录</router-link>
      </p>
      <p v-if="message" :class="['register-message', messageType]">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()

const roleOptions = [
  { code: 1, name: '操作员' },
  { code: 2, name: '质检员' },
  { code: 3, name: '仓管员' },
]

const formRef = ref()
const submitting = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const form = reactive({
  username: '',
  realName: '',
  password: '',
  confirmPassword: '',
  roleCode: 1,
  phone: '',
})

const rules: Record<string, any> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 50, message: '用户名长度 4~50 位', trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: Function) => {
        if (value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  roleCode: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

async function handleRegister() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  message.value = ''
  try {
    const { post } = await import('@/api/index')
    await post('/users/register', {
      username: form.username.trim(),
      realName: form.realName.trim(),
      password: form.password,
      roleCode: form.roleCode,
      phone: form.phone.trim() || undefined,
    })
    message.value = '注册成功！请等待管理员启用账号后登录。'
    messageType.value = 'success'
    setTimeout(() => router.push('/login'), 3000)
  } catch (e: any) {
    message.value = e?.response?.data?.message || '注册失败，请重试'
    messageType.value = 'error'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.register-container { height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a237e, #0d47a1); }
.register-card { width: 440px; padding: 40px; background: #fff; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,.2); }
.register-title { text-align: center; font-size: 28px; font-weight: bold; color: #1a237e; margin-bottom: 4px; }
.register-subtitle { text-align: center; color: #909399; margin-bottom: 24px; font-size: 14px; }
.register-footer { text-align: center; color: #909399; margin-top: 12px; font-size: 13px; }
.register-footer a { color: #409eff; text-decoration: none; }
.register-message { text-align: center; margin-top: 12px; font-size: 13px; padding: 8px; border-radius: 4px; }
.register-message.success { color: #67c23a; background: #f0f9eb; }
.register-message.error { color: #f56c6c; background: #fef0f0; }
</style>
