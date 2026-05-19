<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <div class="header-left">
        <span class="header-title">YT-MES 电芯生产追溯系统</span>
      </div>
      <div class="header-right">
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="user-info">
            {{ authStore.user?.realName || authStore.user?.username }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside width="220px" class="layout-aside">
        <el-menu
          :default-active="route.path"
          router
          background-color="#1a365d"
          text-color="#fff"
          active-text-color="#409eff"
        >
          <el-menu-item index="/dashboard">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-sub-menu index="batches">
            <template #title>
              <el-icon><List /></el-icon>
              <span>批次管理</span>
            </template>
            <el-menu-item index="/batches">批次列表</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="processes">
            <template #title>
              <el-icon><Tools /></el-icon>
              <span>工序录入</span>
            </template>
            <el-menu-item index="/processes/batching">配料</el-menu-item>
            <el-menu-item index="/processes/coating">涂布</el-menu-item>
            <el-menu-item index="/processes/roller-pressing">辊压</el-menu-item>
            <el-menu-item index="/processes/slitting">分切</el-menu-item>
            <el-menu-item index="/processes/electrode">制片</el-menu-item>
            <el-menu-item index="/processes/winding">卷绕</el-menu-item>
            <el-menu-item index="/processes/assembly">装配</el-menu-item>
            <el-menu-item index="/processes/baking">烘烤</el-menu-item>
            <el-menu-item index="/processes/injection">注液</el-menu-item>
            <el-menu-item index="/processes/wrapping">包膜</el-menu-item>
            <el-menu-item index="/processes/formation">化成</el-menu-item>
            <el-menu-item index="/processes/grading">分容</el-menu-item>
            <el-menu-item index="/processes/sorting">分选</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/trace">
            <el-icon><Search /></el-icon>
            <span>电芯追溯</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  HomeFilled, List, Tools, Search, ArrowDown,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

function handleCommand(cmd: string) {
  if (cmd === 'logout') {
    authStore.clearAuth()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1a365d;
  color: #fff;
  padding: 0 20px;
}
.header-title {
  font-size: 18px;
  font-weight: bold;
}
.user-info {
  cursor: pointer;
  color: #fff;
}
.layout-aside {
  background: #1a365d;
  overflow-y: auto;
}
.layout-main {
  background: #f0f2f5;
  padding: 20px;
}
</style>
