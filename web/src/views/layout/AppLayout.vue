<template>
  <div class="app-layout">
    <el-container style="height: 100vh">
      <el-aside width="220px" class="app-aside">
        <div class="logo">YT-MES</div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#001529"
          text-color="#fff"
          active-text-color="#409eff"
        >
          <el-menu-item index="/dashboard">
            <el-icon><HomeFilled /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/big-screen" @click.prevent="openBigScreen">
            <el-icon><DataLine /></el-icon>
            <span>大屏看板</span>
          </el-menu-item>
          <el-menu-item index="/batches">
            <el-icon><List /></el-icon><span>批次管理</span>
          </el-menu-item>
          <el-menu-item index="/processes">
            <el-icon><Setting /></el-icon>
            <span>工序管理</span>
          </el-menu-item>
          <el-menu-item index="/process-hub">
            <el-icon><Monitor /></el-icon>
            <span>现场扫码录入</span>
          </el-menu-item>
          <el-menu-item index="/trace">
            <el-icon><Coin /></el-icon><span>电芯追溯</span>
          </el-menu-item>
          <el-sub-menu index="system">
            <template #title><el-icon><Setting /></el-icon><span>系统管理</span></template>
            <el-menu-item index="/system/users">
              <el-icon><User /></el-icon><span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="/system/roles">
              <el-icon><UserFilled /></el-icon><span>角色管理</span>
            </el-menu-item>
            <el-menu-item index="/system/departments">
              <el-icon><OfficeBuilding /></el-icon><span>部门管理</span>
            </el-menu-item>
            <el-menu-item index="/system/equipment">
              <el-icon><Monitor /></el-icon><span>设备管理</span>
            </el-menu-item>
            <el-menu-item index="/system/logs">
              <el-icon><Document /></el-icon><span>操作日志</span>
            </el-menu-item>
            <el-menu-item index="/system/settings">
              <el-icon><Tools /></el-icon><span>系统配置</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="app-header">
          <span class="header-title">电芯生产追溯系统</span>
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-info">{{ authStore.user?.username || '用户' }}</span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-header>
        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { HomeFilled, List, Setting, Coin, User, UserFilled, OfficeBuilding, Monitor, Document, Tools, DataLine } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const activeMenu = computed(() => route.path)

function openBigScreen() {
  const url = router.resolve({ name: 'BigScreen' }).href
  window.open(url, '_blank')
}

function handleCommand(cmd: string) {
  if (cmd === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.app-aside { background: #001529; overflow: auto; }
.logo { height: 60px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; font-weight: bold; letter-spacing: 2px; }
.app-header { display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #e4e7ed; padding: 0 20px; }
.header-title { font-size: 16px; font-weight: 600; color: #303133; }
.user-info { cursor: pointer; color: #606266; }
.app-main { background: #f5f7fa; padding: 20px; }
</style>
