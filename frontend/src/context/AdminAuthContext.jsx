import { createContext, useContext, useState, useEffect } from 'react';
import {
  adminLogin as apiAdminLogin,
  getAdminMe,
  setAdminToken,
  getAdminToken,
  clearAdminToken,
} from '../services/adminApi';

const AdminAuthContext = createContext(null);

const ADMIN_STORAGE_KEY = 'bazi_admin_cache';

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时验证 token
  useEffect(() => {
    const token = getAdminToken();
    const storedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);

    if (storedAdmin) {
      try {
        const data = JSON.parse(storedAdmin);
        setAdmin(data);
      } catch (e) {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
      }
    }

    if (token) {
      getAdminMe()
        .then((res) => {
          const adminData = res.data;
          setAdmin(adminData);
          localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminData));
        })
        .catch(() => {
          // Token invalid
          clearAdminToken();
          setAdmin(null);
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await apiAdminLogin(username, password);
    setAdminToken(res.data.token);

    const adminData = res.data.admin;
    setAdmin(adminData);
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminData));
    return adminData;
  };

  const logout = () => {
    setAdmin(null);
    clearAdminToken();
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  const value = {
    admin,
    isLoggedIn: !!admin,
    isLoading,
    login,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
