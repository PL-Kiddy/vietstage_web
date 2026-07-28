import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

const AdminLayout = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f9ff' }}>
      <AdminSidebar />
      <main className="ml-64 min-h-screen relative pb-16">
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
