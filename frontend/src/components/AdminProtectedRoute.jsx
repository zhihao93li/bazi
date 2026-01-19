import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Spin } from 'antd';

export default function AdminProtectedRoute({ children }) {
  const { isLoggedIn, isLoading } = useAdminAuth();
  const location = useLocation();

  // 验证登录状态时显示加载
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f0f2f5',
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to={`/admin/login?callbackUrl=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return children;
}
