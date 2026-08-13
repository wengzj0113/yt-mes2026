<template>
  <div class="log-list">
    <el-card>
      <div class="page-header">
        <h3>操作日志</h3>
        <div class="search-bar">
          <el-select v-model="moduleFilter" placeholder="选择模块" clearable style="width: 160px" @change="loadData">
            <el-option v-for="m in modules" :key="m" :label="m" :value="m" />
          </el-select>
          <el-button type="primary" style="margin-left: 12px" @click="loadData">查询</el-button>
        </div>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="操作人" width="120" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="action" label="操作类型" width="120" />
        <el-table-column prop="detail" label="操作内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="createdAt" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { systemApi } from '@/api/system'
import { formatDateTime } from '@/composables/datetime'
import type { LogDto } from '@/types/api'

const modules = ['用户管理', '角色管理', '部门管理', '设备管理', '批次管理', '工序管理', '系统配置', '工序主数据', 'Pack管理']
const moduleFilter = ref('')
const list = ref<LogDto[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

async function loadData() {
  loading.value = true
  try {
    const res = await systemApi.logs({
      page: page.value,
      pageSize: pageSize.value,
      module: moduleFilter.value || undefined,
    })
    list.value = res.data.items
    total.value = res.meta?.total ?? 0
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
.search-bar { display: flex; align-items: center; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
