<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">云通MES</h2>
      <p class="login-subtitle">电芯生产追溯系统</p>
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" :loading="loading" native-type="submit">
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>
      <p class="register-link">
        没有账号？<router-link to="/register">立即注册</router-link>
      </p>
      <p v-if="error" class="login-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Lock } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const error = ref('')

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  error.value = ''
  try {
    // 预览环境自动填充默认账号，方便客户演示
    const isPreviewHost = window.location.hostname.includes('vercel.app') || 
                         window.location.hostname.includes('zeabur.app');
    if (isPreviewHost && !form.username) {
      form.username = 'admin'
      form.password = 'admin123'
    }
    await authStore.login(form.username.trim(), form.password)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e?.response?.data?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container { height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a237e, #0d47a1); }
.login-card { width: 400px; padding: 40px; background: #fff; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,.2); }
.login-title { text-align: center; font-size: 28px; font-weight: bold; color: #1a237e; margin-bottom: 4px; }
.login-subtitle { text-align: center; color: #909399; margin-bottom: 30px; font-size: 14px; }
.login-error { color: #f56c6c; text-align: center; font-size: 13px; }
.register-link { text-align: center; color: #909399; margin: 16px 0 0; font-size: 13px; }
.register-link a { color: #409eff; text-decoration: none; }
</style>
