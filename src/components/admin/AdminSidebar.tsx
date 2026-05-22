import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Settings,
  Plus,
  LogOut,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', href: '/admin' },
  { icon: Users, label: 'Quản lý người dùng', href: '/admin/users' },
  { icon: ClipboardCheck, label: 'Kiểm duyệt nội dung', href: '/admin/review' },
  { icon: Settings, label: 'Cấu hình hệ thống', href: '/admin/settings' },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-primary-container text-on-primary border-r border-on-secondary-fixed-variant flex flex-col py-10 z-20">
      {/* Branding */}
      <div className="px-lg mb-16">
        <h1 className="font-headline-md text-headline-md font-bold text-on-primary tracking-tight">
          VietStage
        </h1>
        <p className="text-[11px] opacity-80 uppercase tracking-widest mt-xs font-medium">
          Hệ thống Quản trị
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-md space-y-sm overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-sm px-lg py-md rounded-lg transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? 'bg-on-primary-fixed-variant text-on-primary font-bold'
                  : 'text-on-primary/80 hover:text-on-primary hover:bg-on-primary-fixed-variant/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-body-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-md mt-auto pt-lg border-t border-on-primary/10">
        <button className="w-full flex items-center justify-center gap-sm bg-on-primary-fixed text-on-primary py-md rounded-lg font-label-md text-label-md mb-lg hover:brightness-110 transition-all">
          <Plus className="w-5 h-5" />
          Báo cáo mới
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-sm px-lg py-md text-on-primary/80 hover:text-on-primary hover:bg-on-primary-fixed-variant/50 transition-colors duration-200 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-body-md">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
