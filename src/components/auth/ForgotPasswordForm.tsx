import { useState, type FormEvent } from 'react';
import { Mail, Send, ArrowLeft, ShieldCheck, CheckCircle, XCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error';
  message: string;
}

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
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

    if (!email.trim()) {
      showToast('error', 'Vui lòng nhập địa chỉ email.');
      return;
    }

    // Simulate OTP send
    showToast('success', 'Mã xác nhận đã được gửi đến email của bạn!');
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

      {/* Form Content */}
      <div className="w-full max-w-[440px] flex flex-col">
        {/* Mobile Branding */}
        <div className="md:hidden flex items-center gap-sm mb-xl">
          <span className="font-display-lg text-headline-md font-bold text-primary">
            VietStage
          </span>
        </div>

        {/* Form Header */}
        <header className="mb-xl">
          <h1 className="font-headline-lg text-headline-lg text-primary mb-md">
            Khôi phục mật khẩu
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Vui lòng nhập Email đã đăng ký. Chúng tôi sẽ gửi mã xác nhận (OTP)
            để bạn đặt lại mật khẩu.
          </p>
        </header>

        {/* Recovery Form */}
        <form className="space-y-lg" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="space-y-xs">
            <label
              className="font-label-md text-label-md text-on-surface block"
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@vietstage.vn"
                required
                className="w-full pl-[48px] pr-md py-md bg-white border border-outline/20 rounded-lg font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-md bg-primary-container text-white font-label-md text-body-md rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-sm"
          >
            Gửi mã xác nhận
            <Send className="w-5 h-5" />
          </button>
        </form>

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
