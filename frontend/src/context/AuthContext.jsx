import { createContext, useContext, useState, useEffect } from 'react'
import { api, setToken, getToken, clearToken } from '../services/api';

const AuthContext = createContext(null)

const STORAGE_KEY = 'bazi_user_cache' // Only cache user info, token is handled by api.js

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // 初始化时从 localStorage 读取缓存的用户信息，并验证 token
  useEffect(() => {
    const token = getToken();
    const storedUser = localStorage.getItem(STORAGE_KEY);
    
    if (storedUser) {
      try {
        const data = JSON.parse(storedUser);
        setUser(data);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (token) {
      api.get('/auth/me')
        .then(res => {
          const userData = { ...res.user, balance: res.user.pointsBalance };
          setUser(userData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        })
        .catch(() => {
          // Token invalid
          clearToken();
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [])

  const login = async (username, password) => {
    const res = await api.post('/auth/login/password', { username, password });
    setToken(res.token);
    
    // Get full profile including points
    const userRes = await api.get('/auth/me');
    const userData = {
      ...userRes.user,
      balance: userRes.user.pointsBalance,
    };
    
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return userData;
  }

  const register = async (username, password) => {
    const res = await api.post('/auth/register', { username, password });
    setToken(res.token); // Backend now returns token on register
    
    const userRes = await api.get('/auth/me');
    const userData = {
      ...userRes.user,
      balance: userRes.user.pointsBalance,
    };
    
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return userData;
  }

  const logout = () => {
    setUser(null);
    clearToken();
    localStorage.removeItem(STORAGE_KEY);
  }

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
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
