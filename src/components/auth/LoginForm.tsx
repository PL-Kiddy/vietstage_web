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

// Form đăng nhập: validate, gọi POST /api/auth/login, lưu session và điều hướng theo role
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

  // Hiển thị toast thông báo, tự ẩn sau 3.5s
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  };

  // Xử lý đăng nhập: learner bị chặn (dùng app di động), admin -> /admin, instructor -> /instructor
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
      <div className="w-full max-w-[480px] bg-white/75 backdrop-blur-md p-10 md:p-12 rounded-[40px] shadow-2xl border border-white/40 flex flex-col items-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-4">
          <img
            src={logoVuong}
            alt="VietStage"
            className="w-28 h-28 object-contain"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-extrabold text-[#1D3E31] tracking-wide mb-2 uppercase">
            CỔNG QUẢN TRỊ & GIẢNG DẠY
          </h2>
          <p className="text-sm text-[#334155] max-w-[340px] leading-relaxed mx-auto font-semibold">
            Hệ thống quản lý bài học và dữ liệu VietStage
          </p>
        </div>

        {/* Login Form */}
        <form className="w-full" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="w-full text-left space-y-2 mb-5">
            <label
              className="text-sm text-[#1E293B] block pl-4 font-bold"
              htmlFor="username"
            >
              Email
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600">
                <User size={20} />
              </span>
              <input
                id="username"
                type="text"
                value={username}
                disabled={isLoading}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Email làm việc"
                className="w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-sm border border-neutral-300/60 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3E31]/20 focus:border-[#1D3E31] transition-all text-base text-neutral-800 placeholder:text-[#64748B] placeholder:font-medium disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="w-full text-left space-y-2 mb-8">
            <div className="flex justify-between items-center px-4">
              <label
                className="text-sm text-[#1E293B] font-bold"
                htmlFor="password"
              >
                Mật khẩu
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-[#8b0000] font-bold hover:underline transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600">
                <Lock size={20} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu của bạn"
                className="w-full pl-12 pr-12 py-3.5 bg-white/50 backdrop-blur-sm border border-neutral-300/60 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3E31]/20 focus:border-[#1D3E31] transition-all text-base text-neutral-800 placeholder:text-[#64748B] placeholder:font-medium disabled:opacity-50"
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900 transition-colors"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#1D3E31] text-white font-bold rounded-full hover:opacity-90 active:scale-95 transition-all duration-200 shadow-md text-base tracking-wider disabled:opacity-50 mt-2"
          >
            {isLoading ? 'ĐANG ĐĂNG NHẬP HỆ THỐNG...' : 'ĐĂNG NHẬP HỆ THỐNG'}
          </button>
        </form>
      </div>
    </>
  );
};

export default LoginForm;
