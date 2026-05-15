import { GraduationCap, Users, BarChart3, ShieldCheck } from 'lucide-react';
import RegisterForm from '../../components/auth/RegisterForm';

const features = [
  { icon: GraduationCap, label: 'Quản lý lớp học thông minh' },
  { icon: Users, label: 'Kết nối sinh viên quốc tế' },
  { icon: BarChart3, label: 'Phân tích tiến độ học tập' },
  { icon: ShieldCheck, label: 'Chứng chỉ chuyên gia uy tín' },
];

const RegisterPage = () => {
  return (
    <main className="flex flex-col md:flex-row w-full min-h-screen">
      {/* Left Side: Visual & Slogan */}
      <section className="hidden md:flex md:w-1/2 relative overflow-hidden bg-primary items-center justify-center p-xl">
        <div className="absolute inset-0 z-0">
          <img
            src="/login-heritage-bg.png"
            alt="Vietnamese Traditional Instruments"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent" />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <div className="mb-lg">
            <span className="font-display-lg text-display-lg font-bold text-white tracking-tight">
              VietStage
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-white mb-md">
            Gìn giữ di sản, lan tỏa âm vang
          </h1>
          <p className="font-body-lg text-body-lg text-primary-fixed opacity-90">
            Gia nhập cộng đồng giảng viên hàng đầu về âm nhạc dân tộc Việt Nam.
            Cùng chúng tôi kiến tạo hành trình âm nhạc truyền thống cho thế hệ
            mai sau.
          </p>

          {/* Feature Grid */}
          <div className="mt-xl grid grid-cols-2 gap-gutter text-left">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-sm">
                <feat.icon className="w-5 h-5 text-secondary-fixed flex-shrink-0" />
                <span className="font-label-md text-label-md text-white">
                  {feat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Right Side: Registration Form */}
      <section className="flex-1 bg-surface flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop min-h-screen">
        {/* Mobile Logo */}
        <div className="md:hidden mb-lg w-full">
          <span className="font-headline-md text-headline-md font-bold text-primary">
            VietStage
          </span>
        </div>

        <RegisterForm />

        {/* Footer */}
        <div className="mt-xl text-center">
          <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60">
            © 2024 VietStage. Preserving Heritage Through Innovation.
          </p>
        </div>
      </section>
    </main>
  );
};

export default RegisterPage;
