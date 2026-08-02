import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

const AdminLayout = () => {
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#F5F5F5]">
      <AdminSidebar />
      <main className="ml-64 flex-1 h-screen flex flex-col overflow-hidden">
        <AdminTopbar />

        {/* Page Content (rendered by child routes) */}
        <section className="mt-16 p-lg flex-1 flex flex-col overflow-y-auto">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;
