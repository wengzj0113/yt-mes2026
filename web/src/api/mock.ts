import type { ApiResponse } from '@/types/api';

// 生成一个模拟的 JWT Token 结构 (header.payload.signature)
// payload 部分 Base64: {"sub":1,"username":"admin","roleCode":4}
const MOCK_JWT_PAYLOAD = btoa(JSON.stringify({ sub: 1, username: 'admin', roleCode: 4 }));
const MOCK_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${MOCK_JWT_PAYLOAD}.mock_signature`;

/**
 * 模拟生产全链路数据
 * 用于 Vercel 预览环境，确保客户在没有后端的情况下也能体验完整流程
 */
export const mockData: Record<string, any> = {
  // 1. 登录 Mock
  '/auth/login': {
    success: true,
    data: {
      accessToken: MOCK_TOKEN,
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user: {
        id: 1,
        username: 'admin',
        realName: '超级管理员 (演示)',
        roleCode: 4, // 管理员权限
        roleName: '管理员',
        departmentId: 1
      }
    }
  },

  // 2. 仪表盘统计
  '/batches/stats': {
    success: true,
    data: {
      totalBatches: 128,
      activeBatches: 12,
      todayPassRate: 98.5,
      pendingAlerts: 3,
      traceabilityRate: 99.2
    }
  },

  // 3. 质量趋势
  '/quality/trends': {
    success: true,
    data: [
      { batchNo: 'WT-20260510-001', passRate: 97.5 },
      { batchNo: 'WT-20260511-001', passRate: 98.2 },
      { batchNo: 'WT-20260512-001', passRate: 96.8 },
      { batchNo: 'WT-20260513-001', passRate: 99.1 },
      { batchNo: 'WT-20260514-001', passRate: 98.5 },
      { batchNo: 'WT-20260515-001', passRate: 97.8 },
      { batchNo: 'WT-20260516-001', passRate: 98.9 },
      { batchNo: 'WT-20260517-001', passRate: 99.3 },
      { batchNo: 'WT-20260518-001', passRate: 98.6 },
      { batchNo: 'WT-20260519-001', passRate: 99.5 }
    ]
  },

  // 4. 操作日志
  '/system/logs': {
    success: true,
    data: {
      items: [
        { id: 1, module: '登录', action: '用户登录', detail: '用户 admin 登录系统', ip: '127.0.0.1', createdAt: new Date().toISOString() },
        { id: 2, module: '批次管理', action: '创建批次', detail: '创建新批次 WT-20260519-001', ip: '127.0.0.1', createdAt: new Date().toISOString() },
        { id: 3, module: '工序管理', action: '录入数据', detail: '录入卷绕工序数据', ip: '127.0.0.1', createdAt: new Date().toISOString() }
      ],
      meta: { total: 3 }
    }
  },

  // 5. 批次列表
  '/batches': {
    success: true,
    data: {
      items: [
        { id: 1, batchNo: 'WT-20260519-001', productModel: 'LFP-100Ah', productSpec: '3.2V', status: 'processing', createdAt: new Date().toISOString() },
        { id: 2, batchNo: 'WT-20260518-002', productModel: 'NMC-811', productSpec: '3.7V', status: 'completed', createdAt: new Date().toISOString() },
        { id: 3, batchNo: 'WT-20260518-001', productModel: 'LFP-50Ah', productSpec: '3.2V', status: 'processing', createdAt: new Date().toISOString() }
      ],
      meta: { total: 3, page: 1, pageSize: 20 }
    }
  },

  // 6. 工序状态 (13道工序)
  '/processes/status/': {
    success: true,
    data: [
      { processKey: 'batching', processName: '配料', status: 'submitted', updatedAt: new Date().toISOString() },
      { processKey: 'coating', processName: '涂布', status: 'submitted', updatedAt: new Date().toISOString() },
      { processKey: 'roller_pressing', processName: '辊压', status: 'submitted', updatedAt: new Date().toISOString() },
      { processKey: 'slitting', processName: '分切', status: 'submitted', updatedAt: new Date().toISOString() },
      { processKey: 'winding', processName: '卷绕', status: 'processing', updatedAt: new Date().toISOString() },
      { processKey: 'assembly', processName: '组装', status: 'not_entered', updatedAt: null },
      { processKey: 'baking', processName: '烘烤', status: 'not_entered', updatedAt: null },
      { processKey: 'injection', processName: '注液', status: 'not_entered', updatedAt: null },
      { processKey: 'formation', processName: '化成', status: 'not_entered', updatedAt: null },
      { processKey: 'grading', processName: '分容', status: 'not_entered', updatedAt: null },
      { processKey: 'storage', processName: '陈化', status: 'not_entered', updatedAt: null },
      { processKey: 'sorting', processName: '分选', status: 'not_entered', updatedAt: null },
      { processKey: 'packing', processName: '包装', status: 'not_entered', updatedAt: null }
    ]
  },

  // 7. 工序字典
  '/process-dictionary': {
    success: true,
    data: {
      items: [
        { id: 1, processCode: 'P01', processName: '配料', sortOrder: 1, isActive: true },
        { id: 2, processCode: 'P02', processName: '涂布', sortOrder: 2, isActive: true },
        { id: 3, processCode: 'P03', processName: '辊压', sortOrder: 3, isActive: true },
        { id: 4, processCode: 'P04', processName: '分切', sortOrder: 4, isActive: true },
        { id: 5, processCode: 'P05', processName: '卷绕', sortOrder: 5, isActive: true }
      ],
      meta: { total: 5 }
    }
  }
};

/**
 * 匹配 Mock 路由
 */
export function getMockResponse(config: any): ApiResponse | null {
  const url = config.url || '';
  
  // 精确匹配
  if (mockData[url]) return mockData[url];
  
  // 模糊匹配 (处理带 ID 或 Query 的 URL)
  for (const key in mockData) {
    if (url.startsWith(key)) {
      return mockData[key];
    }
  }
  
  return null;
}
