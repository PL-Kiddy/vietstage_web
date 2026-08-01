import { Outlet } from 'react-router-dom';
import InstructorSidebar from './InstructorSidebar';
import InstructorTopbar from './InstructorTopbar';

const InstructorLayout = () => {
  return (
    <div className="min-h-screen bg-[#fbf9f4] relative overflow-hidden">
      {/* Ambient Gradient Blobs for Glassmorphic Sidebar */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-[#1D3E31]/8 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] rounded-full bg-[#8b0000]/5 blur-[90px] pointer-events-none z-0" />

      <InstructorSidebar />
      <InstructorTopbar />
      <main className="md:ml-72 pt-24 px-margin-desktop pb-xl min-h-screen z-10 relative">
        <Outlet />
      </main>
    </div>
  );
};

export default InstructorLayout;
