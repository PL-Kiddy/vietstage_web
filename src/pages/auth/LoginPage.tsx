import LoginForm from '../../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <main className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Section: Visual Heritage */}
      <section className="relative hidden md:flex md:w-1/2 lg:w-3/5 h-screen overflow-hidden">
        <img
          src="/login-heritage-bg.png"
          alt="VietStage Heritage"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
        <div className="absolute bottom-xl left-margin-desktop z-10 text-surface-container-lowest">
          <h2 className="font-display-lg text-display-lg mb-sm">VietStage</h2>
          <p className="font-headline-md text-headline-md italic opacity-90">
            Nâng tầm di sản
          </p>
        </div>
      </section>

      {/* Right Section: Login Form */}
      <section className="flex-1 flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop bg-surface-bright relative min-h-screen">
        {/* Mobile Brand Header */}
        <div className="md:hidden absolute top-xl text-center">
          <h1 className="font-display-lg text-headline-lg-mobile text-primary font-bold">
            VietStage
          </h1>
        </div>

        <LoginForm />

        {/* Footer */}
        <div className="absolute bottom-md text-center">
          <p className="font-label-sm text-label-sm text-on-surface-variant/40">
            © 2024 VietStage. Preserving Heritage Through Innovation.
          </p>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
