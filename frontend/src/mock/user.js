// Mock 用户数据
export const mockUser = {
  id: 'user-001',
  username: 'testuser',
  phone: '138****8888',
  balance: 500,
  reportCount: 3,
  totalSpent: 200,
  createdAt: '2026-01-01T00:00:00.000Z',
}

// Mock 用户统计数据
export const mockUserStats = {
  balance: 500,
  reportCount: 3,
  totalSpent: 200,
}

// 获取用户统计（模拟 API）
export async function fetchUserStats() {
  await new Promise(resolve => setTimeout(resolve, 500))
  return mockUserStats
}
