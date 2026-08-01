import { useState, type FormEvent } from 'react';
import { ChevronDown, CheckCircle, XCircle, X, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/services';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error';
  message: string;
}

const RegisterForm = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
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

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      showToast('error', 'Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!agreeTerms) {
      showToast('error', 'Vui lòng đồng ý với điều khoản sử dụng.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register(email.trim(), password, fullName.trim());
      showToast('success', 'Đăng ký thành công. Vui lòng nhập mã OTP để kích hoạt tài khoản.');
      setTimeout(() => {
        navigate(`/verify-registration?email=${encodeURIComponent(email.trim())}`);
      }, 800);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể đăng ký tài khoản.');
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
      <div className="w-full max-w-md bg-white p-lg md:p-xl rounded-xl shadow-[0px_4px_20px_rgba(44,62,80,0.05)] border border-outline-variant/10 relative">
        {/* Back to Login Button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-xs text-on-surface-variant hover:text-primary font-label-md text-sm mb-lg transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại đăng nhập
        </Link>

        {/* Header */}
        <header className="mb-xl">
          <h2 className="font-headline-lg text-headline-lg md:text-headline-lg-mobile text-on-surface mb-xs">
            Tạo tài khoản Học viên
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Bắt đầu hành trình học tập nhạc cụ dân tộc của bạn ngay hôm nay.
          </p>
        </header>

        {/* Registration Form */}
        <form className="space-y-lg" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant ml-1">
              Họ và tên
            </label>
            <input
              type="text"
              value={fullName}
              disabled={isLoading}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-md py-sm border border-outline-variant/30 rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/10 outline-none transition-all disabled:opacity-50"
            />
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant ml-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled={isLoading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full px-md py-sm border border-outline-variant/30 rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/10 outline-none transition-all disabled:opacity-50"
              />
            </div>
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant ml-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                disabled={isLoading}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901 234 567"
                className="w-full px-md py-sm border border-outline-variant/30 rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/10 outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Preferred Instrument Dropdown */}
          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant ml-1">
              Nhạc cụ quan tâm
            </label>
            <div className="relative">
              <select
                value={specialization}
                disabled={isLoading}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full appearance-none px-md py-sm border border-outline-variant/30 rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/10 outline-none transition-all disabled:opacity-50 cursor-pointer"
              >
                <option value="">Chọn nhạc cụ bạn quan tâm</option>
                <option value="dan_bau">Đàn Bầu</option>
                <option value="dan_tranh">Đàn Tranh</option>
                <option value="sao_truc">Sáo Trúc</option>
                <option value="trong">Trống</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 text-on-surface-variant" />
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant ml-1">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-md py-sm border border-outline-variant/30 rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/10 outline-none transition-all disabled:opacity-50"
              />
            </div>
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant ml-1">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={confirmPassword}
                disabled={isLoading}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-md py-sm border border-outline-variant/30 rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/10 outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-sm mt-md">
            <input
              id="terms"
              type="checkbox"
              checked={agreeTerms}
              disabled={isLoading}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-outline-variant/40 text-primary-container focus:ring-primary-container disabled:opacity-50"
            />
            <label
              className="font-label-md text-label-md text-on-surface-variant"
              htmlFor="terms"
            >
              Tôi đồng ý với các{' '}
              <a href="#" className="text-primary font-bold hover:underline">
                điều khoản
              </a>{' '}
              và{' '}
              <a href="#" className="text-primary font-bold hover:underline">
                chính sách
              </a>{' '}
              của VietStage.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-container text-white py-md rounded-lg font-headline-md text-headline-md hover:opacity-90 active:scale-95 transition-all duration-200 mt-xl shadow-lg disabled:opacity-50"
          >
            {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
          </button>
        </form>

        {/* Footer Link */}
        <footer className="mt-xl text-center">
          <p className="font-label-md text-label-md text-on-surface-variant">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="text-primary font-bold hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </footer>
      </div>
    </>
  );
};

export default RegisterForm;
