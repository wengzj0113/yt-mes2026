<template>
  <div class="department-list">
    <el-card>
      <div class="page-header">
        <h3>部门管理</h3>
        <el-button type="primary" @click="openCreate">新增部门</el-button>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="code" label="部门编码" width="140" />
        <el-table-column prop="name" label="部门名称" width="200" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该部门？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑部门' : '新增部门'" width="450px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" @submit.prevent>
        <el-form-item label="部门编码" prop="code">
          <el-input v-model="form.code" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" />
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
import { departmentApi } from '@/api/departments'
import type { DepartmentDto } from '@/types/api'

const list = ref<DepartmentDto[]>([])
const loading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref()

const form = reactive({ code: '', name: '' })
const rules = {
  code: [{ required: true, message: '请输入部门编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
}

async function loadData() {
  loading.value = true
  try {
    const res = await departmentApi.list()
    list.value = res.data
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function resetForm() { form.code = ''; form.name = '' }

function openCreate() {
  isEdit.value = false
  editingId.value = null
  resetForm()
  showDialog.value = true
}

function openEdit(row: DepartmentDto) {
  isEdit.value = true
  editingId.value = row.id
  form.code = row.code
  form.name = row.name
  showDialog.value = true
}

async function handleSave() {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  saving.value = true
  try {
    if (isEdit.value && editingId.value) {
      await departmentApi.update(editingId.value, { name: form.name })
      ElMessage.success('部门更新成功')
    } else {
      await departmentApi.create({ code: form.code, name: form.name })
      ElMessage.success('部门创建成功')
    }
    showDialog.value = false
    loadData()
  } catch {
    // Error handled by interceptor
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: DepartmentDto) {
  try {
    await departmentApi.delete(row.id)
    ElMessage.success('部门已删除')
    loadData()
  } catch {
    // Error handled by interceptor
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
</style>
