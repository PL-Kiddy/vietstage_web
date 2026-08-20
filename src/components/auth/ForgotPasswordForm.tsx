import { useState, type FormEvent } from 'react';
import { Mail, Send, ArrowLeft, CheckCircle, XCircle, X, Key, Lock, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/services';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error';
  message: string;
}

// Form khôi phục mật khẩu 3 bước: gửi OTP -> nhập OTP -> đặt mật khẩu mới
const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [userEnteredOtp, setUserEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: 'success',
    message: '',
  });

  // Hiển thị toast thông báo, tự ẩn sau duration (mặc định 3.5s)
  const showToast = (type: 'success' | 'error', message: string, duration = 3500) => {
    setToast({ visible: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  };

  // Bước 1: gửi OTP tới email qua POST /api/auth/forgot-password
  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;
    if (!email.trim()) {
      showToast('error', 'Vui lòng nhập địa chỉ email.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep(2);
      showToast('success', 'Mã OTP đã được gửi đến email của bạn.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể gửi mã xác nhận.');
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 2: xác nhận OTP (chỉ kiểm tra không rỗng tại UI, sang bước 3)
  const handleVerifyOtp = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userEnteredOtp.trim()) {
      showToast('error', 'Vui lòng nhập mã OTP.');
      return;
    }

    showToast('success', 'OTP đã được nhập. Vui lòng đặt lại mật khẩu mới.');
    setStep(3);
  };

  // Bước 3: đặt lại mật khẩu qua POST /api/auth/reset-password, thành công thì quay lại đăng nhập
  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;
    if (!newPassword || !confirmPassword) {
      showToast('error', 'Vui lòng điền đầy đủ thông tin mật khẩu.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(email.trim(), userEnteredOtp.trim(), newPassword);
      showToast('success', 'Đặt lại mật khẩu thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể cập nhật mật khẩu.');
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
        <span className="font-label-md text-sm whitespace-pre-line">{toast.message}</span>
        <button
          onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
          className="ml-2 hover:opacity-70 transition-opacity"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Content wrapped in Glass Card */}
      <div className="w-full max-w-[480px] bg-white/75 backdrop-blur-md p-10 md:p-12 rounded-[40px] shadow-2xl border border-white/40 flex flex-col relative items-center">
        {/* Back to Login Button */}
        <div className="w-full flex justify-start mb-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-[#1E293B] hover:text-[#8b0000] font-bold transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại đăng nhập
          </Link>
        </div>

        {/* Form Header */}
        <div className="text-center mb-8 w-full">
          <h2 className="text-xl md:text-2xl font-extrabold text-[#1D3E31] tracking-wide mb-2 uppercase">
            {step === 1 && 'Khôi phục mật khẩu'}
            {step === 2 && 'Xác thực OTP'}
            {step === 3 && 'Đặt lại mật khẩu'}
          </h2>
          <p className="text-sm text-[#334155] leading-relaxed mx-auto font-semibold">
            {step === 1 && 'Vui lòng nhập Email đã đăng ký. Chúng tôi sẽ gửi mã xác nhận (OTP) để bạn đặt lại mật khẩu.'}
            {step === 2 && `Mã OTP đã được gửi đến email ${email}. Vui lòng nhập mã để tiếp tục.`}
            {step === 3 && 'Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn.'}
          </p>
        </div>

        {/* Step 1: Send OTP Form */}
        {step === 1 && (
          <form className="w-full space-y-5" onSubmit={handleSendOtp}>
            {/* Email Input */}
            <div className="w-full text-left space-y-2">
              <label
                className="text-sm text-[#1E293B] block pl-4 font-bold"
                htmlFor="recovery-email"
              >
                Địa chỉ Email
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600">
                  <Mail size={20} />
                </span>
                <input
                  id="recovery-email"
                  type="email"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@vietstage.vn"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-sm border border-neutral-300/60 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3E31]/20 focus:border-[#1D3E31] transition-all text-base text-neutral-800 placeholder:text-[#64748B] placeholder:font-medium disabled:opacity-50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#1D3E31] text-white font-bold rounded-full hover:opacity-90 active:scale-95 transition-all duration-200 shadow-md text-base tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? 'ĐANG GỬI MÃ...' : 'GỬI MÃ XÁC NHẬN'}
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP Form */}
        {step === 2 && (
          <form className="w-full space-y-5" onSubmit={handleVerifyOtp}>
            {/* OTP Input */}
            <div className="w-full text-left space-y-2">
              <label
                className="text-sm text-[#1E293B] block pl-4 font-bold"
                htmlFor="otp-code"
              >
                Mã OTP (6 chữ số)
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600">
                  <Key size={20} />
                </span>
                <input
                  id="otp-code"
                  type="text"
                  maxLength={6}
                  value={userEnteredOtp}
                  disabled={isLoading}
                  onChange={(e) => setUserEnteredOtp(e.target.value)}
                  placeholder="Nhập mã OTP..."
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-sm border border-neutral-300/60 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3E31]/20 focus:border-[#1D3E31] transition-all text-base text-neutral-800 placeholder:text-[#64748B] placeholder:font-medium text-center tracking-widest font-mono text-lg disabled:opacity-50"
                />
              </div>
            </div>

            {/* Verification Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#1D3E31] text-white font-bold rounded-full hover:opacity-90 active:scale-95 transition-all duration-200 shadow-md text-base tracking-wider disabled:opacity-50 mt-2"
            >
              XÁC MINH MÃ OTP
            </button>

            {/* Resend Helper */}
            <p className="text-center text-sm text-[#334155] font-semibold mt-2">
              Không nhận được mã?{' '}
              <button
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  if (isLoading) return;
                  setIsLoading(true);
                  try {
                    await authApi.forgotPassword(email.trim());
                    showToast('success', 'Đã gửi lại mã OTP đến email của bạn.');
                  } catch (error) {
                    showToast('error', error instanceof Error ? error.message : 'Không thể gửi lại mã.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="text-[#8b0000] font-bold hover:underline disabled:opacity-50"
              >
                Gửi lại mã
              </button>
            </p>
          </form>
        )}

        {/* Step 3: Reset Password Form */}
        {step === 3 && (
          <form className="w-full space-y-5" onSubmit={handleResetPassword}>
            {/* New Password Input */}
            <div className="w-full text-left space-y-2">
              <label
                className="text-sm text-[#1E293B] block pl-4 font-bold"
                htmlFor="new-password"
              >
                Mật khẩu mới
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600">
                  <Lock size={20} />
                </span>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  disabled={isLoading}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới của bạn"
                  required
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

            {/* Confirm New Password Input */}
            <div className="w-full text-left space-y-2">
              <label
                className="text-sm text-[#1E293B] block pl-4 font-bold"
                htmlFor="confirm-password"
              >
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600">
                  <Lock size={20} />
                </span>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  disabled={isLoading}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-sm border border-neutral-300/60 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3E31]/20 focus:border-[#1D3E31] transition-all text-base text-neutral-800 placeholder:text-[#64748B] placeholder:font-medium disabled:opacity-50"
                />
              </div>
            </div>

            {/* Reset Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#1D3E31] text-white font-bold rounded-full hover:opacity-90 active:scale-95 transition-all duration-200 shadow-md text-base tracking-wider disabled:opacity-50 mt-2"
            >
              {isLoading ? 'ĐANG LƯU MẬT KHẨU...' : 'LƯU MẬT KHẨU MỚI'}
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default ForgotPasswordForm;
