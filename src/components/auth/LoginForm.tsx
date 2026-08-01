import { useState, type FormEvent } from 'react';
import { User, Lock, Eye, EyeOff, CheckCircle, XCircle, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/services';
import { clearAuthSession, saveAuthSession } from '../../api/authStorage';
import logoVuong from '../../assets/logovuongtachnen.png';

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
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    if (!username.trim() || !password.trim()) {
      showToast('error', 'Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login(username.trim(), password);
      // Default rememberMe to true
      const user = saveAuthSession(response, username.trim(), true);

      if (user.role === 'learner') {
        clearAuthSession();
        showToast('error', 'Tài khoản học viên vui lòng đăng nhập trên ứng dụng di động VietStage.');
        setIsLoading(false);
        return;
      }

      showToast('success', `Đăng nhập thành công! Xin chào ${user.name}. Đang chuyển hướng...`);
      setTimeout(() => {
        navigate(user.role === 'admin' ? '/admin' : '/instructor');
      }, 1000);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể đăng nhập.');
      setIsLoading(false);
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
      <div className="w-full max-w-[420px] bg-white/70 backdrop-blur-md p-8 md:p-10 rounded-[32px] shadow-2xl border border-white/40 flex flex-col items-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-2">
          <img
            src={logoVuong}
            alt="VietStage"
            className="w-20 h-20 object-contain"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-neutral-800 mb-1">
            Chào mừng trở lại
          </h2>
          <p className="text-xs text-neutral-500">
            Tiếp tục hành trình khám phá âm nhạc dân tộc
          </p>
        </div>

        {/* Login Form */}
        <form className="w-full" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="w-full text-left space-y-1 mb-4">
            <label
              className="text-xs text-neutral-600 block pl-3 font-medium"
              htmlFor="username"
            >
              Email
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                <User size={18} />
              </span>
              <input
                id="username"
                type="text"
                value={username}
                disabled={isLoading}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Email của bạn"
                className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-neutral-300/50 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3E31]/20 focus:border-[#1D3E31] transition-all text-sm text-neutral-800 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="w-full text-left space-y-1 mb-6">
            <div className="flex justify-between items-center px-3">
              <label
                className="text-xs text-neutral-600 font-medium"
                htmlFor="password"
              >
                Mật khẩu
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-neutral-500 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                <Lock size={18} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu của bạn"
                className="w-full pl-11 pr-11 py-3 bg-white/50 backdrop-blur-sm border border-neutral-300/50 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3E31]/20 focus:border-[#1D3E31] transition-all text-sm text-neutral-800 disabled:opacity-50"
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800 transition-colors"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#1D3E31] text-white font-bold rounded-full hover:opacity-90 active:scale-95 transition-all duration-200 shadow-md text-sm tracking-wider disabled:opacity-50"
          >
            {isLoading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-xs text-neutral-600 mt-4 text-center">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="text-[#1D3E31] font-bold hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </>
  );
};

export default LoginForm;
