import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Settings,
  Database,
} from 'lucide-react';
import logo from '../../assets/logongangtachnen.png';

const navItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', href: '/admin' },
  { icon: Users, label: 'Quản lý người dùng', href: '/admin/users' },
  { icon: ClipboardCheck, label: 'Kiểm duyệt học liệu', href: '/admin/review' },
  { icon: Database, label: 'Dữ liệu nền', href: '/admin/master-data' },
  { icon: Settings, label: 'Cấu hình hệ thống', href: '/admin/settings' },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-white/70 backdrop-blur-md text-[#334155] border-r border-white/40 shadow-md z-20 flex flex-col py-10">
      {/* Branding */}
      <div className="px-lg mb-12">
        <Link to="/" className="block">
          <img
            src={logo}
            alt="VietStage Logo"
            className="w-full h-auto max-h-16 object-contain hover:opacity-85 transition-opacity"
          />
        </Link>
        <p className="text-[11px] text-[#334155] opacity-90 uppercase tracking-widest mt-2 font-bold">
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
                  ? 'bg-[#1D3E31] text-white font-bold shadow-md'
                  : 'text-[#334155] hover:text-[#1D3E31] hover:bg-white/50 font-semibold'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-body-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
