<template>
  <div class="system-settings">
    <el-card>
      <div class="page-header">
        <h3>系统配置</h3>
        <el-button type="primary" @click="handleSave">保存配置</el-button>
      </div>
      <el-table :data="configs" v-loading="loading" stripe>
        <el-table-column prop="key" label="配置键" width="200" />
        <el-table-column prop="description" label="说明" width="200" />
        <el-table-column label="配置值" min-width="300">
          <template #default="{ row, $index }">
            <el-input v-model="configs[$index].value" />
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { systemApi } from '@/api/system'

interface ConfigItem {
  id: number
  key: string
  value: string
  description: string
  updatedAt: string
}

const configs = ref<ConfigItem[]>([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    const res = await systemApi.configs()
    configs.value = res.data
  } catch {
    configs.value = []
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  loading.value = true
  try {
    for (const cfg of configs.value) {
      await systemApi.updateConfig(cfg.id, cfg.value)
    }
    ElMessage.success('配置已保存')
  } catch {
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
</style>
