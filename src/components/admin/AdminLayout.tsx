import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

const AdminLayout = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <AdminSidebar />
      <main className="ml-64 min-h-screen pb-16">
        <AdminTopbar />

        {/* Page Content (rendered by child routes) */}
        <section className="mt-16 p-lg">
          <Outlet />
        </section>

        {/* Footer */}
        <footer className="fixed bottom-0 right-0 w-[calc(100%-16rem)] flex justify-between items-center px-lg py-sm bg-white border-t border-[#E5E7EB] z-10">
          <p className="text-[12px] text-[#9CA3AF]">
            © 2024 VietStage - Hệ thống Bảo tồn Âm nhạc Truyền thống. Phiên bản 2.1.0
          </p>
          <div className="flex gap-lg">
            <a href="#" className="text-[12px] text-[#9CA3AF] hover:text-[#C0392B] transition-all">
              Điều khoản
            </a>
            <a href="#" className="text-[12px] text-[#9CA3AF] hover:text-[#1D4532] transition-all">
              Hỗ trợ kỹ thuật
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AdminLayout;
