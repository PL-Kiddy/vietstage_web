import { useState, type FormEvent } from 'react';
import { ArrowLeft, BadgeCheck, KeyRound } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/services';

const VerifyRegistrationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email) {
      setError('Không tìm thấy email đăng ký. Vui lòng đăng ký lại.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.verifyRegistration(email, otpCode.trim());
      navigate('/login', { replace: true, state: { verified: true } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể xác thực tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff3ce_0,transparent_32%),linear-gradient(135deg,#fbf9f4,#f4e9e6)] flex items-center justify-center p-5">
      <section className="w-full max-w-md bg-white rounded-2xl border border-outline-variant/10 shadow-xl p-7 md:p-9">
        <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary mb-7"><ArrowLeft className="w-4 h-4" /> Quay lại đăng ký</Link>
        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-5"><BadgeCheck className="w-7 h-7" /></div>
        <h1 className="text-3xl font-bold text-on-surface">Xác thực tài khoản</h1>
        <p className="text-on-surface-variant mt-2">Nhập mã OTP đã được gửi đến <strong className="text-on-surface">{email || 'email của bạn'}</strong>.</p>
        {error && <div className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">{error}</div>}
        <form onSubmit={(event) => void submit(event)} className="mt-7 space-y-5">
          <label className="block"><span className="block text-sm font-semibold mb-2">Mã OTP</span><div className="relative"><KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" /><input autoFocus required inputMode="numeric" autoComplete="one-time-code" value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Nhập mã xác thực" className="input pl-12 text-lg tracking-[0.2em]" /></div></label>
          <button disabled={loading || !otpCode} className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-md disabled:opacity-50">{loading ? 'Đang xác thực...' : 'Xác nhận tài khoản'}</button>
        </form>
      </section>
    </main>
  );
};

export default VerifyRegistrationPage;