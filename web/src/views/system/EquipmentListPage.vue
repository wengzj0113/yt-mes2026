<template>
  <div class="equipment-list">
    <el-card>
      <div class="page-header">
        <h3>设备管理</h3>
        <el-button type="primary" @click="openCreate">新增设备</el-button>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="equipmentCode" label="设备编号" width="140" />
        <el-table-column prop="equipmentName" label="设备名称" width="200" />
        <el-table-column prop="model" label="型号" width="150" />
        <el-table-column prop="departmentCode" label="所属部门" width="120" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该设备？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑设备' : '新增设备'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" @submit.prevent>
        <el-form-item label="设备编号" prop="equipmentCode">
          <el-input v-model="form.equipmentCode" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="设备名称" prop="equipmentName">
          <el-input v-model="form.equipmentName" />
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-input v-model="form.model" />
        </el-form-item>
        <el-form-item label="所属部门" prop="departmentCode">
          <el-select v-model="form.departmentCode" placeholder="请选择部门" style="width: 100%" clearable>
            <el-option v-for="d in departments" :key="d.code" :label="d.name" :value="d.code" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { equipmentApi } from '@/api/equipment'
import { departmentApi } from '@/api/departments'
import type { EquipmentDto, DepartmentDto } from '@/types/api'

const list = ref<EquipmentDto[]>([])
const departments = ref<DepartmentDto[]>([])
const loading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref()

const form = reactive({
  equipmentCode: '',
  equipmentName: '',
  model: '',
  departmentCode: '',
})

const rules = {
  equipmentCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  equipmentName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
}

async function loadData() {
  loading.value = true
  try {
    const res = await equipmentApi.list()
    list.value = res.data
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

async function loadDepartments() {
  try {
    const res = await departmentApi.list()
    departments.value = res.data
  } catch {
    departments.value = []
  }
}

function resetForm() {
  form.equipmentCode = ''
  form.equipmentName = ''
  form.model = ''
  form.departmentCode = ''
}

function openCreate() {
  isEdit.value = false
  editingId.value = null
  resetForm()
  showDialog.value = true
}

function openEdit(row: EquipmentDto) {
  isEdit.value = true
  editingId.value = row.id
  form.equipmentCode = row.equipmentCode
  form.equipmentName = row.equipmentName
  form.model = row.model || ''
  form.departmentCode = row.departmentCode || ''
  showDialog.value = true
}

async function handleSave() {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  saving.value = true
  try {
    if (isEdit.value && editingId.value) {
      await equipmentApi.update(editingId.value, {
        equipmentName: form.equipmentName,
        model: form.model || undefined,
        departmentCode: form.departmentCode || undefined,
      })
      ElMessage.success('设备更新成功')
    } else {
      await equipmentApi.create({
        equipmentCode: form.equipmentCode,
        equipmentName: form.equipmentName,
        model: form.model || undefined,
        departmentCode: form.departmentCode || undefined,
      })
      ElMessage.success('设备创建成功')
    }
    showDialog.value = false
    loadData()
  } catch {
    // Error handled by interceptor
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: EquipmentDto) {
  try {
    await equipmentApi.delete(row.id)
    ElMessage.success('设备已删除')
    loadData()
  } catch {
    // Error handled by interceptor
  }
}

onMounted(() => {
  loadData()
  loadDepartments()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
</style>
