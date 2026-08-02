import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

const AdminLayout = () => {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F5F5F5' }}>
      <AdminSidebar />
      <main className="ml-64 flex-1 min-h-screen flex flex-col">
        <AdminTopbar />

        {/* Page Content (rendered by child routes) */}
        <section className="mt-16 p-lg flex-1 flex flex-col">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;
