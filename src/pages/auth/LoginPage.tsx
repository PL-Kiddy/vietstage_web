import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import bgImage from '../../assets/logincogiaoMaithoisao.png';
import { getAuthSession } from '../../api/authStorage';

// Trang đăng nhập: nếu đã có session hợp lệ thì tự chuyển hướng về portal theo role
const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      if (session.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (session.role === 'instructor') {
        navigate('/instructor', { replace: true });
      }
    }
  }, [navigate]);

  return (
    <main 
      className="min-h-screen flex items-center justify-center md:justify-end bg-cover bg-center relative p-md md:pr-[12%] lg:pr-[18%]"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/10 z-0" />

      {/* Content Wrapper */}
      <div className="relative z-10 flex justify-center md:justify-end">
        <LoginForm />
      </div>
    </main>
  );
};

export default LoginPage;
