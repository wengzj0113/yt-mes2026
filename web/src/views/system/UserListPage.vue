<template>
  <div class="user-list">
    <el-card>
      <div class="page-header">
        <h3>用户管理</h3>
        <el-button type="primary" @click="openCreate">新增用户</el-button>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="roleCode" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.roleCode === 4 ? 'danger' : row.roleCode === 3 ? 'warning' : row.roleCode === 2 ? 'success' : ''" size="small">
              {{ roleMap[row.roleCode] || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" :type="row.isActive ? 'warning' : 'success'" @click="toggleStatus(row)">
              {{ row.isActive ? '禁用' : '启用' }}
            </el-button>
            <el-popconfirm title="确定删除该用户？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑用户' : '新增用户'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" @submit.prevent>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="roleCode">
          <el-select v-model="form.roleCode" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r.code" :label="r.name" :value="r.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
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
import { userApi } from '@/api/users'
import type { UserDto } from '@/types/api'

const roleMap: Record<number, string> = { 1: '操作员', 2: '质检员', 3: '仓管员', 4: '管理员' }
const roleOptions = Object.entries(roleMap).map(([code, name]) => ({ code: Number(code), name }))

const list = ref<UserDto[]>([])
const loading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref()

const form = reactive({
  username: '',
  realName: '',
  password: '',
  roleCode: 1,
  phone: '',
})

const rules: Record<string, any> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

async function loadData() {
  loading.value = true
  try {
    const res = await userApi.list()
    list.value = res.data
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.username = ''
  form.realName = ''
  form.password = ''
  form.roleCode = 1
  form.phone = ''
}

function openCreate() {
  isEdit.value = false
  editingId.value = null
  resetForm()
  rules.password = [{ required: true, message: '请输入密码', trigger: 'blur' }]
  showDialog.value = true
}

function openEdit(row: UserDto) {
  isEdit.value = true
  editingId.value = row.id
  form.username = row.username
  form.realName = row.realName
  form.roleCode = row.roleCode
  form.phone = row.phone || ''
  form.password = ''
  rules.password = []
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
    if (isEdit.value && editingId.value) {
      await userApi.update(editingId.value, {
        realName: form.realName,
        roleCode: form.roleCode,
        phone: form.phone || undefined,
      })
      ElMessage.success('用户更新成功')
    } else {
      await userApi.create({
        username: form.username,
        realName: form.realName,
        password: form.password,
        roleCode: form.roleCode,
        phone: form.phone || undefined,
      })
      ElMessage.success('用户创建成功')
    }
    showDialog.value = false
    loadData()
  } catch {
    // Error handled by interceptor
  } finally {
    saving.value = false
  }
}

async function toggleStatus(row: UserDto) {
  try {
    await userApi.update(row.id, { isActive: !row.isActive })
    ElMessage.success(row.isActive ? '用户已禁用' : '用户已启用')
    loadData()
  } catch {
    // Error handled by interceptor
  }
}

async function handleDelete(row: UserDto) {
  try {
    await userApi.delete(row.id)
    ElMessage.success('用户已删除')
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
