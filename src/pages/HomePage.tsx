// Trang chủ giới thiệu (hiện chưa được route trong App.tsx — dead code)
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import TechnologySection from '../components/home/TechnologySection';
import InstrumentsSection from '../components/home/InstrumentsSection';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <TechnologySection />
        <InstrumentsSection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
