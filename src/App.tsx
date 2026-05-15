import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LoadingScreen from './components/common/LoadingScreen';
import useLoading from './hooks/useLoading';

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
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
