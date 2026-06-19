import { useState, type FormEvent } from 'react';
import { User, Lock, Eye, EyeOff, CheckCircle, XCircle, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authenticateUser } from '../../data/mockUsers';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error';
  message: string;
}

const LoginForm = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: 'success',
    message: '',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      showToast('error', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    const user = authenticateUser(username.trim(), password);

    if (user) {
      // If user is a learner, block login and show message
      if (user.role === 'learner') {
        showToast('error', 'Tài khoản học viên vui lòng đăng nhập trên ứng dụng di động VietStage.');
        return;
      }

      showToast(
        'success',
        `Đăng nhập thành công! Xin chào ${user.name}. Đang chuyển hướng...`
      );
      // Persist the user session in sessionStorage
      sessionStorage.setItem('vietstage_current_user', JSON.stringify(user));
      
      // Redirect based on role after toast displays
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'instructor') {
          navigate('/instructor');
        }
      }, 1500);
    } else {
      showToast('error', 'Email hoặc mật khẩu không chính xác.');
    }
  };

  return (
    <>
      {/* Toast Notification */}
      <div
        className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-xl transition-all duration-500 ease-in-out ${
          toast.visible
            ? 'translate-x-0 opacity-100'
            : 'translate-x-[120%] opacity-0'
        } ${
          toast.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-error text-on-error'
        }`}
      >
        {toast.type === 'success' ? (
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 flex-shrink-0" />
        )}
        <span className="font-label-md text-sm">{toast.message}</span>
        <button
          onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
          className="ml-2 hover:opacity-70 transition-opacity"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-[440px] glass-effect p-lg md:p-xl rounded-xl shadow-lg">
        {/* Header */}
        <div className="text-center mb-xl">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
            Chào mừng trở lại
          </h2>
          <p className="font-body-md text-on-surface-variant opacity-70">
            Tiếp tục hành trình khám phá âm nhạc dân tộc
          </p>
        </div>

        {/* Login Form */}
        <form className="space-y-lg" onSubmit={handleSubmit}>
          {/* Email / Username Field */}
          <div className="space-y-xs">
            <label
              className="font-label-md text-label-md text-on-surface"
              htmlFor="username"
            >
              Email/Tên đăng nhập
            </label>
            <div className="relative group">
              <User className="absolute left-md top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-secondary transition-colors" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập email hoặc tên của bạn"
                className="w-full pl-[48px] pr-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-body-md"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-xs">
            <label
              className="font-label-md text-label-md text-on-surface"
              htmlFor="password"
            >
              Mật khẩu
            </label>
            <div className="relative group">
              <Lock className="absolute left-md top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-secondary transition-colors" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-[48px] pr-[48px] py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-body-md"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-sm cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer h-5 w-5 border-outline rounded text-primary focus:ring-primary transition-all"
                />
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface">
                Ghi nhớ đăng nhập
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="font-label-md text-label-md text-primary-container hover:text-primary transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-md bg-primary-container text-on-primary font-label-md text-headline-md rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all"
          >
            Đăng nhập
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-xl flex items-center">
          <div className="flex-grow border-t border-outline-variant/30"></div>
          <span className="flex-shrink mx-md font-label-sm text-label-sm text-on-surface-variant/50">
            HOẶC
          </span>
          <div className="flex-grow border-t border-outline-variant/30"></div>
        </div>

        {/* Footer Link */}
        <div className="text-center">
          <p className="font-label-md text-label-md text-on-surface-variant">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="text-primary font-bold hover:underline ml-xs"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginForm;
