<template>
  <div class="sorter-log-list">
    <el-card>
      <div class="page-header">
        <h3>设备接口日志</h3>
        <div class="search-bar">
          <el-select
            v-model="apiTypeFilter"
            placeholder="接口类型"
            clearable
            style="width: 140px; margin-right: 12px"
            @change="handleSearch"
          >
            <el-option label="全部" value="" />
            <el-option label="分选机" value="sorter" />
            <el-option label="OCV1" value="ocv1" />
            <el-option label="OCV2" value="ocv2" />
          </el-select>
          <el-input
            v-model="apiEndpointFilter"
            placeholder="接口路径"
            clearable
            style="width: 200px; margin-right: 12px"
            @keyup.enter="handleSearch"
          />
          <el-select
            v-model="statusFilter"
            placeholder="调用状态"
            clearable
            style="width: 140px; margin-right: 12px"
            @change="handleSearch"
          >
            <el-option label="全部" value="" />
            <el-option label="成功" value="true" />
            <el-option label="失败" value="false" />
          </el-select>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="apiEndpoint" label="接口路径" min-width="220" show-overflow-tooltip />
        <el-table-column prop="apiType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.apiType === 'sorter' ? '' : row.apiType === 'ocv1' ? 'warning' : 'success'" effect="plain">
              {{ ({ sorter: '分选机', ocv1: 'OCV1', ocv2: 'OCV2' } as Record<string, string>)[row.apiType] || row.apiType || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="method" label="请求方法" width="100">
          <template #default="{ row }">
            <el-tag type="info" effect="plain">{{ row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="statusCode" label="状态码" width="100">
          <template #default="{ row }">
            <el-tag :type="row.statusCode >= 200 && row.statusCode < 300 ? 'success' : 'danger'">
              {{ row.statusCode }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isSuccess" label="是否成功" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isSuccess ? 'success' : 'danger'" effect="dark">
              {{ row.isSuccess ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="duration" label="耗时" width="100">
          <template #default="{ row }">
            <span>{{ row.duration !== null ? `${row.duration} ms` : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="调用时间" width="180">
          <template #default="{ row }">
            <span>{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="showDetail(row)">查看详情</el-button>
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

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailVisible"
      title="接口调用详情"
      size="600px"
      destroy-on-close
    >
      <div v-if="activeRow" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="ID">{{ activeRow.id }}</el-descriptions-item>
          <el-descriptions-item label="接口路径">{{ activeRow.apiEndpoint }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="activeRow.apiType === 'sorter' ? '' : activeRow.apiType === 'ocv1' ? 'warning' : 'success'" effect="plain">
              {{ ({ sorter: '分选机', ocv1: 'OCV1', ocv2: 'OCV2' } as Record<string, string>)[activeRow.apiType] || activeRow.apiType || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="请求方法">{{ activeRow.method }}</el-descriptions-item>
          <el-descriptions-item label="状态码">{{ activeRow.statusCode }}</el-descriptions-item>
          <el-descriptions-item label="是否成功">
            <el-tag :type="activeRow.isSuccess ? 'success' : 'danger'">
              {{ activeRow.isSuccess ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ activeRow.ip || '-' }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ activeRow.duration !== null ? `${activeRow.duration} ms` : '-' }}</el-descriptions-item>
          <el-descriptions-item label="调用时间">{{ formatDate(activeRow.createdAt) }}</el-descriptions-item>
          <el-descriptions-item v-if="!activeRow.isSuccess" label="错误信息">
            <span class="error-text">{{ activeRow.errorMessage || '-' }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="json-section">
          <h4>请求内容 (Request Body)</h4>
          <pre class="json-block">{{ formatJson(activeRow.requestBody) }}</pre>
        </div>

        <div class="json-section">
          <h4>响应内容 (Response Body)</h4>
          <pre class="json-block">{{ formatJson(activeRow.responseBody) }}</pre>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { systemApi } from '@/api/system'
import { formatDateTime } from '@/composables/datetime'

const apiEndpointFilter = ref('')
const statusFilter = ref('')
const apiTypeFilter = ref('')
const list = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const detailVisible = ref(false)
const activeRow = ref<any>(null)

async function loadData() {
  loading.value = true
  try {
    const res = await systemApi.sorterLogs({
      page: page.value,
      pageSize: pageSize.value,
      apiEndpoint: apiEndpointFilter.value || undefined,
      isSuccess: statusFilter.value === 'true' ? true : statusFilter.value === 'false' ? false : undefined,
      apiType: apiTypeFilter.value || undefined,
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

function handleSearch() {
  page.value = 1
  loadData()
}

function showDetail(row: any) {
  activeRow.value = row
  detailVisible.value = true
}

function formatJson(val: string) {
  if (!val) return '无数据'
  try {
    const obj = JSON.parse(val)
    return JSON.stringify(obj, null, 2)
  } catch {
    return val
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return formatDateTime(dateStr, { withSeconds: true })
}

onMounted(loadData)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
.search-bar { display: flex; align-items: center; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
.detail-content { padding: 10px; }
.error-text { color: #f56c6c; word-break: break-all; }
.json-section { margin-top: 20px; }
.json-section h4 { margin: 0 0 8px 0; color: #606266; }
.json-block {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  font-family: monospace;
  font-size: 12px;
  max-height: 250px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}
</style>
