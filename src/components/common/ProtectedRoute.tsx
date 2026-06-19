import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: ('admin' | 'instructor')[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const userString = sessionStorage.getItem('vietstage_current_user');

  if (!userString) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userString);
    if (!allowedRoles.includes(user.role)) {
      // Redirect to home or appropriate portal if role is not allowed
      return <Navigate to={user.role === 'admin' ? '/admin' : '/instructor'} replace />;
    }
  } catch (e) {
    // Clear corrupted session and redirect to login
    sessionStorage.removeItem('vietstage_current_user');
    return <Navigate to="/login" replace />;
  }

  // Render matching child routes
  return <Outlet />;
};

export default ProtectedRoute;
