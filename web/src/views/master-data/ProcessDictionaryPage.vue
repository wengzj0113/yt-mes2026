<template>
  <div class="process-dictionary-page">
    <el-card class="box-card" style="min-height: calc(100vh - 120px);">
      <template #header>
        <div class="card-header">
          <span class="title">工序主数据管理</span>
          <el-button v-if="isAdmin" type="primary" :icon="Plus" @click="handleAdd">新增工序</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form" @submit.prevent="handleSearch">
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="工序编码/名称" clearable @clear="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.isActive" placeholder="全部" clearable @change="handleSearch" style="width: 120px;">
            <el-option label="启用" value="true" />
            <el-option label="停用" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" style="width: 100%" border stripe>
        <el-table-column prop="sortOrder" label="排序号" width="80" align="center" />
        <el-table-column prop="processCode" label="工序编码" width="180" />
        <el-table-column prop="processName" label="工序名称" width="180" />
        <el-table-column prop="isActive" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="备注说明" />
        <el-table-column v-if="isAdmin" label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button size="small" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确定要删除此工序吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button size="small" type="danger" :icon="Delete">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog :title="isEdit ? '编辑工序' : '新增工序'" v-model="dialogVisible" width="500px">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="工序编码" prop="processCode">
          <el-input v-model="formData.processCode" placeholder="如: coating" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="工序名称" prop="processName">
          <el-input v-model="formData.processName" placeholder="如: 涂布" />
        </el-form-item>
        <el-form-item label="排序号" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="isActive">
          <el-switch v-model="formData.isActive" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="备注说明" prop="description">
          <el-input type="textarea" v-model="formData.description" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue';
import { processDictionaryApi, type ProcessDictionaryDto } from '@/api/process-dictionary';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.roleCode === 4);

const tableData = ref<ProcessDictionaryDto[]>([]);
const loading = ref(false);
const total = ref(0);

const searchForm = ref({
  keyword: '',
  isActive: '',
  page: 1,
  pageSize: 20
});

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();

const formData = ref<Partial<ProcessDictionaryDto>>({
  processCode: '',
  processName: '',
  sortOrder: 0,
  isActive: true,
  description: ''
});

const rules: FormRules = {
  processCode: [{ required: true, message: '请输入工序编码', trigger: 'blur' }],
  processName: [{ required: true, message: '请输入工序名称', trigger: 'blur' }],
  sortOrder: [{ required: true, message: '请输入排序号', trigger: 'blur' }]
};

onMounted(() => {
  fetchData();
});

function handleSearch() {
  searchForm.value.page = 1;
  fetchData();
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await processDictionaryApi.list({
      keyword: searchForm.value.keyword,
      isActive: searchForm.value.isActive,
      page: searchForm.value.page,
      pageSize: searchForm.value.pageSize
    });
    tableData.value = res.data?.items || [];
    total.value = res.data?.meta?.total || 0;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  isEdit.value = false;
  formData.value = {
    processCode: '',
    processName: '',
    sortOrder: tableData.value.length > 0 ? Math.max(...tableData.value.map(item => item.sortOrder)) + 10 : 10,
    isActive: true,
    description: ''
  };
  dialogVisible.value = true;
  if (formRef.value) {
    formRef.value.clearValidate();
  }
}

function handleEdit(row: ProcessDictionaryDto) {
  isEdit.value = true;
  formData.value = { ...row };
  dialogVisible.value = true;
  if (formRef.value) {
    formRef.value.clearValidate();
  }
}

async function handleDelete(id?: number) {
  if (!id) return;
  try {
    await processDictionaryApi.delete(id);
    ElMessage.success('删除成功');
    fetchData();
  } catch (error: any) {
    // Note: The global axios interceptor will already show the error message.
    console.error(error);
  }
}

async function submitForm() {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (isEdit.value && formData.value.id) {
          await processDictionaryApi.update(formData.value.id, formData.value);
          ElMessage.success('修改成功');
        } else {
          await processDictionaryApi.create(formData.value);
          ElMessage.success('新增成功');
        }
        dialogVisible.value = false;
        fetchData();
      } catch (error) {
        console.error(error);
      } finally {
        submitLoading.value = false;
      }
    }
  });
}
</script>

<style scoped>
.process-dictionary-page {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 16px;
  font-weight: bold;
}
.search-form {
  margin-bottom: 20px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>