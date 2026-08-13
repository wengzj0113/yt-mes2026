<template>
  <div class="role-list">
    <el-card>
      <div class="page-header">
        <h3>角色管理</h3>
        <el-button type="primary" @click="openCreate">新增角色</el-button>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="code" label="角色编码" width="120" />
        <el-table-column prop="name" label="角色名称" width="180" />
        <el-table-column label="说明">
          <template #default="{ row }">
            {{ row.description || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isSystem ? 'danger' : 'success'" size="small">
              {{ row.isSystem ? '系统内置' : '自定义' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" :disabled="row.isSystem" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm
              :title="row.isSystem ? '系统内置角色不可删除' : '确定删除该角色？'"
              :disabled="row.isSystem"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button size="small" type="danger" :disabled="row.isSystem">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑角色' : '新增角色'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" @submit.prevent>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model.number="form.code" :disabled="isEdit" placeholder="不小于 5 的整数" />
        </el-form-item>
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：包装组长" />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可选，描述该角色用途" />
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { systemApi } from '@/api/system'
import { formatDateTime } from '@/composables/datetime'
import type { RoleDto } from '@/types/api'

const list = ref<RoleDto[]>([])
const loading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const editingCode = ref<number | null>(null)
const formRef = ref()

const form = reactive({ code: undefined as number | undefined, name: '', description: '' })
const rules = {
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    {
      validator(_: unknown, value: number, cb: (e?: Error) => void) {
        if (!Number.isInteger(value) || value < 5) {
          cb(new Error('角色编码必须为不小于 5 的整数'))
        } else {
          cb()
        }
      },
      trigger: 'blur',
    },
  ],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
}

async function loadData() {
  loading.value = true
  try {
    const res = await systemApi.roles()
    list.value = res.data
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.code = undefined
  form.name = ''
  form.description = ''
}

function openCreate() {
  isEdit.value = false
  editingCode.value = null
  resetForm()
  showDialog.value = true
}

function openEdit(row: RoleDto) {
  isEdit.value = true
  editingCode.value = row.code
  form.code = row.code
  form.name = row.name
  form.description = row.description || ''
  showDialog.value = true
}

async function handleSave() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    }
    if (isEdit.value && editingCode.value) {
      await systemApi.updateRole(editingCode.value, payload)
      ElMessage.success('角色更新成功')
    } else {
      await systemApi.createRole({
        code: Number(form.code),
        name: payload.name,
        description: payload.description,
      })
      ElMessage.success('角色创建成功')
    }
    showDialog.value = false
    loadData()
  } catch {
    // Error handled by interceptor
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: RoleDto) {
  try {
    await systemApi.deleteRole(row.code)
    ElMessage.success('角色已删除')
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