import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'bazi_auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // 初始化时从 localStorage 读取
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setUser(data.user)
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  // Mock 登录
  const login = async (username, password) => {
    // 模拟 API 调用延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Mock 验证 - 任何用户名密码都可以登录
    if (!username || !password) {
      throw new Error('请输入用户名和密码')
    }
    
    if (password.length < 6) {
      throw new Error('密码至少6位')
    }

    const mockUser = {
      id: `user-${Date.now()}`,
      username,
      phone: null,
      balance: 100, // 新用户赠送 100 积分
      createdAt: new Date().toISOString(),
    }

    setUser(mockUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: mockUser }))
    
    return mockUser
  }

  // Mock 注册
  const register = async (username, password) => {
    // 模拟 API 调用延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (!username || !password) {
      throw new Error('请输入用户名和密码')
    }
    
    if (username.length < 3) {
      throw new Error('用户名至少3位')
    }
    
    if (password.length < 6) {
      throw new Error('密码至少6位')
    }

    // 检查用户名是否已存在 (mock)
    const existingUsers = JSON.parse(localStorage.getItem('bazi_users') || '[]')
    if (existingUsers.includes(username)) {
      throw new Error('用户名已存在')
    }
    
    // 保存用户名
    existingUsers.push(username)
    localStorage.setItem('bazi_users', JSON.stringify(existingUsers))

    const mockUser = {
      id: `user-${Date.now()}`,
      username,
      phone: null,
      balance: 100, // 新用户赠送 100 积分
      createdAt: new Date().toISOString(),
    }

    setUser(mockUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: mockUser }))
    
    return mockUser
  }

  // 退出登录
  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  // 更新用户信息
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: updatedUser }))
  }

  const value = {
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
