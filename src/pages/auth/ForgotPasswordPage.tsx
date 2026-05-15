import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

const ForgotPasswordPage = () => {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side: Immersive Image (Hidden on mobile) */}
      <section className="hidden md:flex md:w-1/2 lg:w-3/5 h-screen sticky top-0 bg-surface-container overflow-hidden">
        <div className="relative w-full h-full">
          <img
            src="/login-heritage-bg.png"
            alt="VietStage Traditional Heritage"
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle Gradient Overlay */}
          <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />

          {/* Brand Anchor */}
          <div className="absolute top-margin-desktop left-margin-desktop">
            <span className="font-display-lg text-headline-md font-bold text-white drop-shadow-lg">
              VietStage
            </span>
          </div>

          {/* Artistic Text */}
          <div className="absolute bottom-xl left-margin-desktop right-margin-desktop text-white">
            <h2 className="font-headline-lg text-headline-lg mb-sm">
              Gìn giữ nét Việt
            </h2>
            <p className="font-body-md text-body-md opacity-90 max-w-md">
              Khám phá và bảo tồn di sản âm nhạc truyền thống qua lăng kính
              công nghệ hiện đại.
            </p>
          </div>
        </div>
      </section>

      {/* Right Side: Form Canvas */}
      <section className="flex-1 flex items-center justify-center px-margin-mobile md:px-margin-desktop py-xl bg-surface min-h-screen">
        <ForgotPasswordForm />
      </section>

      {/* Global Footer (Desktop only) */}
      <footer className="absolute bottom-0 w-full md:w-1/2 right-0 hidden md:flex justify-between items-center px-margin-desktop py-md">
        <span className="font-label-sm text-label-sm text-on-surface-variant/60">
          © 2024 VietStage. Preserving Heritage Through Innovation.
        </span>
        <div className="flex gap-lg">
          <a
            href="#"
            className="font-label-sm text-label-sm text-on-surface-variant/60 hover:text-primary transition-all"
          >
            Support
          </a>
          <a
            href="#"
            className="font-label-sm text-label-sm text-on-surface-variant/60 hover:text-primary transition-all"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </main>
  );
};

export default ForgotPasswordPage;
