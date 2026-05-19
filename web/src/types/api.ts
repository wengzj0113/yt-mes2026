export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  error?: string
  meta?: { total: number; page: number; pageSize: number }
}

export interface LoginDto {
  username: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: { id: number; username: string; realName: string; roleCode: number }
}

export interface BatchDto {
  id: number
  batchNo: string
  productModel: string
  productSpec: string
  plannedQty: number
  status: number
  isDraft: boolean
  createdBy: number
  createdAt: string
}

export interface MaterialDto {
  id: number
  batchNo: string
  materialType: number
  supplierBatchNo: string
  warehousePerson: string
  status: number
  quantity: number
  unit: string
  createdAt: string
}

// ---- System Management Types ----

export interface UserDto {
  id: number
  username: string
  realName: string
  roleCode: number
  phone: string | null
  isActive: boolean
  createdAt: string
}

export interface DepartmentDto {
  id: number
  name: string
  code: string
  isActive: boolean
  createdAt: string
}

export interface EquipmentDto {
  id: number
  equipmentCode: string
  equipmentName: string
  model: string | null
  departmentCode: string | null
  isActive: boolean
  createdAt: string
}

export interface RoleDto {
  code: number
  name: string
}

export interface LogDto {
  id: number
  userId: number
  username: string
  action: string
  module: string
  detail: string
  ip: string
  createdAt: string
}

export interface SystemConfigDto {
  id: number
  key: string
  value: string
  description: string
  updatedAt: string
}
