import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import bgImage from '../../assets/logincogiaoMaithoisao.png';

const ForgotPasswordPage = () => {
  return (
    <main 
      className="min-h-screen flex items-center justify-center md:justify-end bg-cover bg-center relative p-md md:pr-[12%] lg:pr-[18%]"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/10 z-0" />

      {/* Content Wrapper */}
      <div className="relative z-10 flex justify-center md:justify-end">
        <ForgotPasswordForm />
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
