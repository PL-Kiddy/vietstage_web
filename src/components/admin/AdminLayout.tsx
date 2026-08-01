import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

const AdminLayout = () => {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#f7f9ff' }}>
      {/* Ambient Gradient Blobs for Glassmorphic Sidebar */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-[#1D3E31]/8 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] rounded-full bg-[#8b0000]/5 blur-[90px] pointer-events-none z-0" />

      <AdminSidebar />
      <main className="ml-64 min-h-screen relative pb-16 z-10">
        <AdminTopbar />

        {/* Page Content (rendered by child routes) */}
        <section className="mt-16 p-lg">
          <Outlet />
        </section>

        {/* Footer */}
        <footer className="fixed bottom-0 right-0 w-[calc(100%-16rem)] flex justify-between items-center px-lg py-sm bg-[#f7f9ff] border-t border-[#d1e4fb] z-10">
          <p className="text-[12px] text-[#5e5e5b]">
            © 2024 VietStage - Hệ thống Bảo tồn Âm nhạc Truyền thống. Phiên bản 2.1.0
          </p>
          <div className="flex gap-lg">
            <a href="#" className="text-[12px] text-[#5e5e5b] hover:text-primary hover:underline transition-all">
              Điều khoản
            </a>
            <a href="#" className="text-[12px] text-[#5e5e5b] hover:text-primary hover:underline transition-all">
              Hỗ trợ kỹ thuật
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AdminLayout;
