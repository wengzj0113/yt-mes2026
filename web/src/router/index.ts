import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/views/layout/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/LoginPage.vue'),
      meta: { public: true },
    },
    {
    path: '/big-screen',
    name: 'BigScreen',
    component: () => import('@/views/dashboard/BigScreenPage.vue'),
    meta: { title: '大屏看板' }
  },
  {
    path: '/',
      component: AppLayout,
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/IndexPage.vue') },
        { path: 'batches', name: 'BatchList', component: () => import('@/views/batch/BatchListPage.vue') },
        { path: 'batches/:batchNo', name: 'BatchDetail', component: () => import('@/views/batch/BatchDetailPage.vue') },
        { path: 'processes', name: 'ProcessDictionary', component: () => import('@/views/master-data/ProcessDictionaryPage.vue') },
        { path: 'process-hub', name: 'ProcessHub', component: () => import('@/views/processes/ProcessHubPage.vue') },
        { path: 'processes/:batchNo/batching', name: 'Batching', component: () => import('@/views/processes/BatchingPage.vue') },
        { path: 'processes/:batchNo/coating', name: 'Coating', component: () => import('@/views/processes/CoatingPage.vue') },
        { path: 'processes/:batchNo/roller-pressing', name: 'RollerPressing', component: () => import('@/views/processes/RollerPressingPage.vue') },
        { path: 'processes/:batchNo/slitting', name: 'Slitting', component: () => import('@/views/processes/SlittingPage.vue') },
        { path: 'processes/:batchNo/sorting', name: 'Sorting', component: () => import('@/views/processes/SortingPage.vue') },
        { path: 'processes/:batchNo/electrode', name: 'Electrode', component: () => import('@/views/processes/ElectrodePage.vue') },
        { path: 'processes/:batchNo/winding', name: 'Winding', component: () => import('@/views/processes/WindingPage.vue') },
        { path: 'processes/:batchNo/assembly', name: 'Assembly', component: () => import('@/views/processes/AssemblyPage.vue') },
        { path: 'processes/:batchNo/baking', name: 'Baking', component: () => import('@/views/processes/BakingPage.vue') },
        { path: 'processes/:batchNo/injection', name: 'Injection', component: () => import('@/views/processes/InjectionPage.vue') },
        { path: 'processes/:batchNo/wrapping', name: 'Wrapping', component: () => import('@/views/processes/WrappingPage.vue') },
        { path: 'processes/:batchNo/formation', name: 'Formation', component: () => import('@/views/processes/FormationPage.vue') },
        { path: 'processes/:batchNo/grading', name: 'Grading', component: () => import('@/views/processes/GradingPage.vue') },
        { path: 'quality/:batchNo', name: 'QualityCheck', component: () => import('@/views/quality/QualityCheckPage.vue') },
        { path: 'materials/:batchNo', name: 'MaterialWarehouse', component: () => import('@/views/material/MaterialWarehousePage.vue') },
        { path: 'trace', name: 'CellTrace', component: () => import('@/views/cells/CellTracePage.vue') },

        // System Management
        { path: 'system/users', name: 'UserList', component: () => import('@/views/system/UserListPage.vue') },
        { path: 'system/roles', name: 'RoleList', component: () => import('@/views/system/RoleListPage.vue') },
        { path: 'system/departments', name: 'DepartmentList', component: () => import('@/views/system/DepartmentListPage.vue') },
        { path: 'system/equipment', name: 'EquipmentList', component: () => import('@/views/system/EquipmentListPage.vue') },
        { path: 'system/logs', name: 'LogList', component: () => import('@/views/system/LogListPage.vue') },
        { path: 'system/settings', name: 'SystemSettings', component: () => import('@/views/system/SystemSettingsPage.vue') },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  
  // 生产环境下，如果尝试在 8080 端口访问大屏，重定向到 8081
  if (to.name === 'BigScreen' && !import.meta.env.DEV && window.location.port !== '8081') {
    const protocol = window.location.protocol
    const host = window.location.hostname
    window.location.href = `${protocol}//${host}:8081`
    return
  }

  if (to.meta.public || auth.isLoggedIn) {
    next()
  } else {
    next('/login')
  }
})

export default router
