import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingOverlay } from './common';

/**
 * GuestRoute - 只允许未登录用户访问的路由守卫
 * 用于登录页、注册页等"已登录用户不应访问"的页面
 * 
 * 与 ProtectedRoute 相反：
 * - ProtectedRoute: 未登录 → 跳转登录页
 * - GuestRoute: 已登录 → 跳转到 callbackUrl 或默认页面
 */
export default function GuestRoute({ children, redirectTo = '/' }) {
    const { isLoggedIn, isLoading } = useAuth();
    const [searchParams] = useSearchParams();

    // 验证登录状态时显示加载
    if (isLoading) {
        return <LoadingOverlay fixed />;
    }

    // 已登录用户重定向
    if (isLoggedIn) {
        const callbackUrl = searchParams.get('callbackUrl') || redirectTo;
        return <Navigate to={callbackUrl} replace />;
    }

    return children;
}
