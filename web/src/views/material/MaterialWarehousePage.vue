<template>
  <div class="material-warehouse">
    <el-card>
      <div class="page-header">
        <h3>材料仓库 - {{ batchNo }}</h3>
        <div class="page-actions">
          <el-button v-if="!props.batchNo" @click="$router.push(`/batches/${batchNo}`)">返回批次</el-button>
          <el-button type="primary" @click="showCreate = true">添加材料</el-button>
        </div>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="材料类型" width="120">
          <template #default="{ row }">{{ materialTypeMap[row.materialType] || row.materialType }}</template>
        </el-table-column>
        <el-table-column prop="supplierBatchNo" label="供应商批次号" width="200" />
        <el-table-column prop="warehousePerson" label="仓库人员" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '合格' : '不合格' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreate" title="添加材料" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" @submit.prevent>
        <el-form-item label="材料类型" prop="materialType">
          <el-select v-model="form.materialType" placeholder="请选择材料类型" style="width: 100%" @change="onTypeChange">
            <el-option v-for="[val, label] in materialTypeOptions" :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商批次号" prop="supplierBatchNo">
          <el-input v-model="form.supplierBatchNo" placeholder="请输入合格入仓材料批次号" />
        </el-form-item>
        <el-form-item label="仓库人员" prop="warehousePerson">
          <el-input v-model="form.warehousePerson" placeholder="请输入仓库人员姓名" />
        </el-form-item>
        <el-form-item label="质量状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1" border>合格</el-radio>
            <el-radio :value="2" border>不合格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="form.quantity" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input :model-value="form.unit" disabled style="width: 100px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { materialApi } from '@/api/material'
import { formatDateTime } from '@/composables/datetime'
import type { MaterialDto } from '@/types/api'

const props = defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const route = useRoute()
const batchNo = computed(() => props.batchNo || (route.params.batchNo as string))

const list = ref<MaterialDto[]>([])
const loading = ref(false)
const formRef = ref()
const showCreate = ref(false)
const saving = ref(false)

const materialTypeMap: Record<number, string> = { 1: '正极', 2: '负极', 3: '电解液', 4: '隔膜', 5: '外壳/盖帽' }
const materialTypeOptions = Object.entries(materialTypeMap).map(([k, v]) => [Number(k), v] as const)

const UNIT_MAP: Record<number, string> = { 1: 'kg', 2: 'kg', 3: 'kg', 4: '卷', 5: '个' }

const form = reactive({
  materialType: undefined as number | undefined,
  supplierBatchNo: '',
  warehousePerson: '',
  status: 1,
  quantity: 1,
  unit: 'kg',
})

const rules = {
  materialType: [{ required: true, message: '请选择材料类型', trigger: 'change' }],
  supplierBatchNo: [{ required: true, message: '请输入供应商批次号', trigger: 'blur' }],
  warehousePerson: [{ required: true, message: '请输入仓库人员姓名', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
}

function onTypeChange(val: number) {
  form.unit = UNIT_MAP[val] || 'kg'
}

async function loadData() {
  loading.value = true
  try {
    const res = await materialApi.list(batchNo.value)
    list.value = res.data as MaterialDto[]
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    await materialApi.create(batchNo.value, {
      ...form,
      materialType: form.materialType!,
      status: form.status,
      supplierBatchNo: form.supplierBatchNo.trim(),
      warehousePerson: form.warehousePerson.trim(),
    })
    showCreate.value = false
    loadData()
  } catch {
    // Error handled by axios interceptor
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
.page-actions { display: flex; gap: 8px; }
</style>
