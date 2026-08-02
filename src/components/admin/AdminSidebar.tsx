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
    <aside className="h-screen w-64 fixed left-0 top-0 bg-white text-[#374151] border-r border-[#E5E7EB] shadow-[2px_0_12px_rgba(0,0,0,0.04)] z-20 flex flex-col py-8">
      {/* Branding */}
      <div className="px-6 mb-10">
        <Link to="/" className="block">
          <img
            src={logo}
            alt="VietStage Logo"
            className="w-full h-auto max-h-14 object-contain hover:opacity-85 transition-opacity"
          />
        </Link>
        <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest mt-2 font-semibold text-center">
          Hệ thống Quản trị
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium ${
                isActive
                  ? 'bg-[#EDF7F2] text-[#1D4532] font-semibold'
                  : 'text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]'
              }`}
            >
              {/* Active red strip on left */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1D4532] rounded-r-full" />
              )}
              <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-[#1D4532]' : 'text-[#9CA3AF]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
};

export default AdminSidebar;
