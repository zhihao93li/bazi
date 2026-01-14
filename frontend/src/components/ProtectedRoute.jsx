import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingOverlay } from './common';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  // 验证登录状态时显示全屏加载遮罩
  if (isLoading) {
    return <LoadingOverlay fixed />;
  }

  if (!isLoggedIn) {
    return <Navigate to={`/login?callbackUrl=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children;
}
