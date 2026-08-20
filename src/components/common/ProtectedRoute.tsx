import { Navigate, Outlet } from 'react-router-dom';
import { getAuthSession } from '../../api/authStorage';

interface ProtectedRouteProps {
  allowedRoles: ('admin' | 'instructor')[];
}

// Route bảo vệ: chưa đăng nhập -> /login; sai role -> chuyển về portal tương ứng
const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const user = getAuthSession();
  if (!user?.accessToken) {
    return <Navigate to="/login" replace />;
  }

  // learner hoặc role ngoài danh sách cho phép -> redirect về portal phù hợp
  if (user.role === 'learner' || !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/instructor'} replace />;
  }

  // Render matching child routes
  return <Outlet />;
};

export default ProtectedRoute;
