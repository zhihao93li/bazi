import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Or a loading spinner
    return null; 
  }

  if (!isLoggedIn) {
    return <Navigate to={`/login?callbackUrl=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children;
}
