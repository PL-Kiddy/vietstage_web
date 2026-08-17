import { Outlet } from 'react-router-dom';
import InstructorSidebar from './InstructorSidebar';
import InstructorTopbar from './InstructorTopbar';

// Bố cục trang Instructor: sidebar + topbar + vùng nội dung
const InstructorLayout = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <InstructorSidebar />
      <InstructorTopbar />
      <main className="md:ml-64 pt-20 px-6 pb-10 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default InstructorLayout;
