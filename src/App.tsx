import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LoadingScreen from './components/common/LoadingScreen';
import useLoading from './hooks/useLoading';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReview from './pages/admin/AdminReview';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProfile from './pages/admin/AdminProfile';
import InstructorLayout from './components/instructor/InstructorLayout';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorLessons from './pages/instructor/InstructorLessons';
import InstructorStudents from './pages/instructor/InstructorStudents';
import InstructorMedia from './pages/instructor/InstructorMedia';
import InstructorProfile from './pages/instructor/InstructorProfile';

function App() {
  // Show loading screen for 2.5s on initial app load
  const { isLoading } = useLoading({ autoStart: true, minDuration: 2500 });

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="review" element={<AdminReview />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          {/* Instructor Routes */}
          <Route path="/instructor" element={<InstructorLayout />}>
            <Route index element={<InstructorDashboard />} />
            <Route path="lessons" element={<InstructorLessons />} />
            <Route path="students" element={<InstructorStudents />} />
            <Route path="media" element={<InstructorMedia />} />
            <Route path="profile" element={<InstructorProfile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

