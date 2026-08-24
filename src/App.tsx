import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LoadingScreen from './components/common/LoadingScreen';
import useLoading from './hooks/useLoading';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReview from './pages/admin/AdminReview';
import AdminSettings from './pages/admin/AdminSettings';
import AdminMasterData from './pages/admin/AdminMasterData';
import AdminProfile from './pages/admin/AdminProfile';
import AdminCosmetics from './pages/admin/AdminCosmetics';
import InstructorLayout from './components/instructor/InstructorLayout';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorLessons from './pages/instructor/InstructorLessons';
import InstructorLessonContent from './pages/instructor/InstructorLessonContent';
import InstructorStudents from './pages/instructor/InstructorStudents';
import InstructorMedia from './pages/instructor/InstructorMedia';
import InstructorProfile from './pages/instructor/InstructorProfile';

import { getAuthSession } from './api/authStorage';

function App() {
  // Show loading screen for 2.5s on initial app load
  // Hiển thị màn hình khởi tạo tối thiểu 2.5s khi mở app
  const { isLoading } = useLoading({ autoStart: true, minDuration: 2500 });

  // Silent background wake-up ping for Render backend cold-start
  // Ping nền để đánh thức backend Render (tránh cold-start chậm khi mở lại)
  useEffect(() => {
    const session = getAuthSession();
    const headers: Record<string, string> = {};
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }
    fetch('/api/instruments', { headers }).catch(() => {});
  }, []);

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <BrowserRouter>
        <Routes>
          {/* Trang công khai: đăng nhập + quên mật khẩu */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Admin Routes - with layout */}
          {/* Routes Admin (bảo vệ bởi role=admin), dùng chung AdminLayout */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/staff" element={<AdminUsers />} />
              <Route path="users/learners" element={<AdminUsers />} />
              <Route path="review" element={<AdminReview />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="master-data" element={<AdminMasterData />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="cosmetics" element={<AdminCosmetics />} />
            </Route>
          </Route>

          {/* Instructor Routes - with layout */}
          {/* Routes Instructor (bảo vệ bởi role=instructor), dùng chung InstructorLayout */}
          <Route element={<ProtectedRoute allowedRoles={['instructor']} />}>
            <Route path="/instructor" element={<InstructorLayout />}>
              <Route index element={<InstructorDashboard />} />
              <Route path="lessons" element={<InstructorLessons />} />
              <Route path="lessons/:lessonId/content" element={<InstructorLessonContent />} />
              <Route path="students" element={<InstructorStudents />} />
              <Route path="media" element={<InstructorMedia />} />
              <Route path="profile" element={<InstructorProfile />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

