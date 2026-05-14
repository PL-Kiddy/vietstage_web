import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import RolesSection from '../components/home/RolesSection';
import TechnologySection from '../components/home/TechnologySection';
import InstrumentsSection from '../components/home/InstrumentsSection';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <RolesSection />
        <TechnologySection />
        <InstrumentsSection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
