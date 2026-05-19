<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <h3>今日批次</h3>
          <p class="stat-number">--</p>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <h3>进行中</h3>
          <p class="stat-number">--</p>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <h3>已完成</h3>
          <p class="stat-number">--</p>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <h3>待处理</h3>
          <p class="stat-number">--</p>
        </el-card>
      </el-col>
    </el-row>
    <el-card class="welcome-card">
      <h2>欢迎使用 YT-MES 电芯生产追溯系统</h2>
      <p>当前用户：{{ authStore.user?.realName || authStore.user?.username }}</p>
      <p>角色：{{ authStore.roleLabel }}</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
</script>

<style scoped>
.dashboard {
  padding: 20px;
}
.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin: 10px 0;
}
.welcome-card {
  margin-top: 20px;
}
</style>
