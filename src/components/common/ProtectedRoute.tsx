import { Navigate, Outlet } from 'react-router-dom';
import { getAuthSession } from '../../api/authStorage';

interface ProtectedRouteProps {
  allowedRoles: ('admin' | 'instructor')[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const user = getAuthSession();
  if (!user?.accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'learner' || !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/instructor'} replace />;
  }

  // Render matching child routes
  return <Outlet />;
};

export default ProtectedRoute;
