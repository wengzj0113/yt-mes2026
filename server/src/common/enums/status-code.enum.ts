export const BusinessStatusCode = {
  SUCCESS: { code: 'SUCCESS', message: '操作成功', httpStatus: 200 },

  // 4xx
  BAD_REQUEST: { code: 'BAD_REQUEST', message: '请求参数错误', httpStatus: 400 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: '未登录或 Token 已过期', httpStatus: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', message: '权限不足', httpStatus: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', message: '资源不存在', httpStatus: 404 },
  CONFLICT: { code: 'CONFLICT', message: '资源冲突', httpStatus: 409 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', message: '请求参数校验失败', httpStatus: 422 },

  // Business 4xx
  USER_NOT_FOUND: { code: 'USER_NOT_FOUND', message: '用户不存在', httpStatus: 404 },
  USER_PASSWORD_ERROR: { code: 'USER_PASSWORD_ERROR', message: '密码错误', httpStatus: 401 },
  USER_DISABLED: { code: 'USER_DISABLED', message: '账号已被禁用', httpStatus: 403 },
  USER_LOCKED: { code: 'USER_LOCKED', message: '账号已被锁定，请稍后再试', httpStatus: 423 },
  BATCH_NOT_FOUND: { code: 'BATCH_NOT_FOUND', message: '批次不存在', httpStatus: 404 },
  BATCH_STATUS_CONFLICT: { code: 'BATCH_STATUS_CONFLICT', message: '批次状态不匹配', httpStatus: 409 },
  PROCESS_DRAFT_EXISTS: { code: 'PROCESS_DRAFT_EXISTS', message: '草稿已存在', httpStatus: 409 },
  PROCESS_ALREADY_SUBMITTED: { code: 'PROCESS_ALREADY_SUBMITTED', message: '记录已提交', httpStatus: 409 },
  PROCESS_FIELDS_INCOMPLETE: { code: 'PROCESS_FIELDS_INCOMPLETE', message: '字段未填写完整', httpStatus: 422 },
  BATCH_STATUS_TRANSITION_INVALID: { code: 'BATCH_STATUS_TRANSITION_INVALID', message: '状态转换不合法', httpStatus: 422 },
  CELL_BARCODE_DUPLICATE: { code: 'CELL_BARCODE_DUPLICATE', message: '电芯码重复导入', httpStatus: 409 },

  // 5xx
  INTERNAL_ERROR: { code: 'SYSTEM_INTERNAL_ERROR', message: '服务器内部错误', httpStatus: 500 },
} as const;

export type BusinessCode = keyof typeof BusinessStatusCode;
