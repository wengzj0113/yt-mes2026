<template>
  <div class="role-list">
    <el-card>
      <div class="page-header">
        <h3>角色管理</h3>
      </div>
      <el-table :data="roles" stripe>
        <el-table-column prop="code" label="角色代码" width="120" />
        <el-table-column label="角色名称" width="200">
          <template #default="{ row }">
            <el-tag :type="row.code === 4 ? 'danger' : row.code === 3 ? 'warning' : row.code === 2 ? 'success' : ''">
              {{ row.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="说明">
          <template #default="{ row }">
            {{ row.code === 4 ? '系统管理员，拥有全部权限' : row.code === 3 ? '仓库管理，物料出入库' : row.code === 2 ? '质量控制，巡检检验' : '生产线操作，工序录入' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
const roles = [
  { code: 1, name: '操作员' },
  { code: 2, name: '质检员' },
  { code: 3, name: '仓管员' },
  { code: 4, name: '管理员' },
]
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
</style>
