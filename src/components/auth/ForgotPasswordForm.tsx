import { useState, type FormEvent } from 'react';
import { Mail, Send, ArrowLeft, ShieldCheck, CheckCircle, XCircle, X, Key, Lock, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/services';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error';
  message: string;
}

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

  const showToast = (type: 'success' | 'error', message: string, duration = 3500) => {
    setToast({ visible: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  };

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

  const handleVerifyOtp = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userEnteredOtp.trim()) {
      showToast('error', 'Vui lòng nhập mã OTP.');
      return;
    }

    showToast('success', 'OTP đã được nhập. Vui lòng đặt lại mật khẩu mới.');
    setStep(3);
  };

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

      {/* Form Content */}
      <div className="w-full max-w-[440px] flex flex-col relative">
        {/* Back to Login Button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-xs text-on-surface-variant hover:text-primary font-label-md text-sm mb-lg transition-colors group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại đăng nhập
        </Link>

        {/* Form Header */}
        <header className="mb-xl">
          <h1 className="font-headline-lg text-headline-lg text-primary mb-md">
            {step === 1 && 'Khôi phục mật khẩu'}
            {step === 2 && 'Xác thực OTP'}
            {step === 3 && 'Đặt lại mật khẩu'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {step === 1 && 'Vui lòng nhập Email đã đăng ký. Chúng tôi sẽ gửi mã xác nhận (OTP) để bạn đặt lại mật khẩu.'}
            {step === 2 && `Mã OTP đã được gửi đến email ${email}. Vui lòng nhập mã để tiếp tục.`}
            {step === 3 && 'Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn.'}
          </p>
        </header>

        {/* Step 1: Send OTP Form */}
        {step === 1 && (
          <form className="space-y-lg" onSubmit={handleSendOtp}>
            {/* Email Input */}
            <div className="space-y-xs">
              <label
                className="font-label-md text-label-md text-on-surface block font-semibold"
                htmlFor="recovery-email"
              >
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute left-md top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  id="recovery-email"
                  type="email"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@vietstage.vn"
                  required
                  className="w-full pl-[48px] pr-md py-md bg-white border border-outline/20 rounded-lg font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all placeholder:text-on-surface-variant/40 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-md bg-primary-container text-white font-label-md text-body-md rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-sm disabled:opacity-50"
            >
              {isLoading ? 'Đang gửi mã...' : 'Gửi mã xác nhận'}
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP Form */}
        {step === 2 && (
          <form className="space-y-lg" onSubmit={handleVerifyOtp}>
            {/* OTP Input */}
            <div className="space-y-xs">
              <label
                className="font-label-md text-label-md text-on-surface block font-semibold"
                htmlFor="otp-code"
              >
                Mã OTP (6 chữ số)
              </label>
              <div className="relative">
                <Key className="absolute left-md top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  id="otp-code"
                  type="text"
                  maxLength={6}
                  value={userEnteredOtp}
                  disabled={isLoading}
                  onChange={(e) => setUserEnteredOtp(e.target.value)}
                  placeholder="Nhập mã OTP..."
                  required
                  className="w-full pl-[48px] pr-md py-md bg-white border border-outline/20 rounded-lg font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all placeholder:text-on-surface-variant/40 text-center tracking-widest font-mono text-lg disabled:opacity-50"
                />
              </div>
            </div>

            {/* Verification Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-md bg-primary-container text-white font-label-md text-body-md rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-sm disabled:opacity-50"
            >
              Xác minh mã OTP
            </button>

            {/* Resend Helper */}
            <p className="text-center text-label-sm text-on-surface-variant">
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
                className="text-primary font-bold hover:underline disabled:opacity-50"
              >
                Gửi lại mã
              </button>
            </p>
          </form>
        )}

        {/* Step 3: Reset Password Form */}
        {step === 3 && (
          <form className="space-y-lg" onSubmit={handleResetPassword}>
            {/* New Password Input */}
            <div className="space-y-xs">
              <label
                className="font-label-md text-label-md text-on-surface block font-semibold"
                htmlFor="new-password"
              >
                Mật khẩu mới
              </label>
              <div className="relative group">
                <Lock className="absolute left-md top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-secondary transition-colors" />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  disabled={isLoading}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-[48px] pr-[48px] py-md bg-white border border-outline/20 rounded-lg font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all placeholder:text-on-surface-variant/40 disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Input */}
            <div className="space-y-xs">
              <label
                className="font-label-md text-label-md text-on-surface block font-semibold"
                htmlFor="confirm-password"
              >
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="absolute left-md top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  disabled={isLoading}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-[48px] pr-md py-md bg-white border border-outline/20 rounded-lg font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all placeholder:text-on-surface-variant/40 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Reset Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-md bg-primary-container text-white font-label-md text-body-md rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-sm disabled:opacity-50"
            >
              {isLoading ? 'Đang lưu mật khẩu...' : 'Lưu mật khẩu mới'}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <footer className="mt-xl text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-xs font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
            Quay lại Đăng nhập
          </Link>
        </footer>

        {/* Security Info Box */}
        <div className="mt-auto pt-xl border-t border-outline-variant/10">
          <div className="flex items-start gap-md p-md bg-surface-container-low rounded-xl">
            <div className="p-sm bg-secondary-container/20 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h4 className="font-label-md text-label-md text-on-surface">
                Bảo mật tài khoản
              </h4>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Tài khoản của bạn được bảo vệ bởi hệ thống xác thực VietStage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordForm;


