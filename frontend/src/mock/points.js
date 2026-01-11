// Mock 积分套餐
export const mockPackages = [
  { id: 'pkg-1', name: '基础', points: 100, price: 10.00 },
  { id: 'pkg-2', name: '标准', points: 500, price: 45.00 },
  { id: 'pkg-3', name: '高级', points: 1000, price: 80.00, popular: true },
  { id: 'pkg-4', name: '至尊', points: 5000, price: 350.00 },
]

// Mock 积分明细
export const mockTransactions = [
  {
    id: 'tx-1',
    type: 'bonus',
    amount: 100,
    balance: 100,
    description: '新用户注册赠送',
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'tx-2',
    type: 'recharge',
    amount: 500,
    balance: 600,
    description: '充值 - 标准套餐',
    createdAt: '2026-01-10T14:30:00.000Z',
  },
  {
    id: 'tx-3',
    type: 'consume',
    amount: -50,
    balance: 550,
    description: '命理分析 - 张三',
    createdAt: '2026-01-10T15:00:00.000Z',
  },
  {
    id: 'tx-4',
    type: 'consume',
    amount: -50,
    balance: 500,
    description: '命理分析 - 李四',
    createdAt: '2026-01-11T09:00:00.000Z',
  },
]

// 获取积分明细（模拟 API）
export async function fetchPointsData() {
  await new Promise(resolve => setTimeout(resolve, 500))
  return {
    balance: 500,
    transactions: mockTransactions,
  }
}

// 获取套餐列表（模拟 API）
export async function fetchPackages() {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockPackages
}
