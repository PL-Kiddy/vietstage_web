import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Settings,
  Database,
  ChevronDown,
  ChevronRight,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import logo from '../../assets/logongangtachnen.png';

const AdminSidebar = () => {
  const location = useLocation();
  const isUsersRoute = location.pathname.startsWith('/admin/users');
  const [isUsersOpen, setIsUsersOpen] = useState(isUsersRoute);

  useEffect(() => {
    if (isUsersRoute) {
      setIsUsersOpen(true);
    }
  }, [location.pathname, isUsersRoute]);

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-white/75 backdrop-blur-xl text-[#374151] border-r border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.06)] z-20 flex flex-col py-8">
      {/* Branding */}
      <div className="px-6 mb-8">
        <Link to="/" className="block">
          <img
            src={logo}
            alt="VietStage Logo"
            className="w-full h-auto max-h-14 object-contain hover:opacity-85 transition-opacity"
          />
        </Link>
        <p className="text-[12px] text-[#1D4532] uppercase tracking-widest mt-2.5 font-bold text-center">
          Hệ thống Quản trị
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        {/* Tổng quan */}
        <Link
          to="/admin"
          className={`relative flex items-center gap-3 px-3.5 h-11 rounded-lg transition-all duration-150 text-[14px] font-medium ${
            location.pathname === '/admin'
              ? 'bg-[#EDF7F2] text-[#1D4532] font-semibold'
              : 'text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]'
          }`}
        >
          {location.pathname === '/admin' && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1D4532] rounded-r-full" />
          )}
          <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${location.pathname === '/admin' ? 'text-[#1D4532]' : 'text-[#9CA3AF]'}`} />
          <span className="whitespace-nowrap">Tổng quan</span>
        </Link>

        {/* Quản lý người dùng Dropdown */}
        <div>
          <button
            type="button"
            onClick={() => setIsUsersOpen(!isUsersOpen)}
            className={`w-full relative flex items-center justify-between px-3.5 h-11 rounded-lg transition-all duration-150 text-[14px] font-medium ${
              isUsersRoute
                ? 'bg-[#EDF7F2]/60 text-[#1D4532] font-semibold'
                : 'text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Users className={`w-5 h-5 flex-shrink-0 ${isUsersRoute ? 'text-[#1D4532]' : 'text-[#9CA3AF]'}`} />
              <span className="whitespace-nowrap">Quản lý người dùng</span>
            </div>
            {isUsersOpen ? (
              <ChevronDown className="w-4 h-4 text-[#1D4532] flex-shrink-0 ml-1" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] flex-shrink-0 ml-1" />
            )}
          </button>

          {/* Sub-menu items */}
          {isUsersOpen && (
            <div className="ml-4 pl-3 border-l border-[#E5E7EB] mt-1 space-y-1">
              <Link
                to="/admin/users/staff"
                className={`relative flex items-center gap-2.5 px-3 h-9 rounded-lg transition-all text-[13.5px] font-medium ${
                  location.pathname === '/admin/users/staff' || location.pathname === '/admin/users'
                    ? 'bg-[#EDF7F2] text-[#1D4532] font-semibold'
                    : 'text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span className="whitespace-nowrap">Quản lý thành viên</span>
              </Link>
              <Link
                to="/admin/users/learners"
                className={`relative flex items-center gap-2.5 px-3 h-9 rounded-lg transition-all text-[13.5px] font-medium ${
                  location.pathname === '/admin/users/learners'
                    ? 'bg-[#EDF7F2] text-[#1D4532] font-semibold'
                    : 'text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span className="whitespace-nowrap">Quản lý học viên</span>
              </Link>
            </div>
          )}
        </div>

        {/* Kiểm duyệt học liệu */}
        <Link
          to="/admin/review"
          className={`relative flex items-center gap-3 px-3.5 h-11 rounded-lg transition-all duration-150 text-[14px] font-medium ${
            location.pathname === '/admin/review'
              ? 'bg-[#EDF7F2] text-[#1D4532] font-semibold'
              : 'text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]'
          }`}
        >
          {location.pathname === '/admin/review' && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1D4532] rounded-r-full" />
          )}
          <ClipboardCheck className={`w-5 h-5 flex-shrink-0 ${location.pathname === '/admin/review' ? 'text-[#1D4532]' : 'text-[#9CA3AF]'}`} />
          <span className="whitespace-nowrap">Kiểm duyệt học liệu</span>
        </Link>

        {/* Dữ liệu nền */}
        <Link
          to="/admin/master-data"
          className={`relative flex items-center gap-3 px-3.5 h-11 rounded-lg transition-all duration-150 text-[14px] font-medium ${
            location.pathname === '/admin/master-data'
              ? 'bg-[#EDF7F2] text-[#1D4532] font-semibold'
              : 'text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]'
          }`}
        >
          {location.pathname === '/admin/master-data' && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1D4532] rounded-r-full" />
          )}
          <Database className={`w-5 h-5 flex-shrink-0 ${location.pathname === '/admin/master-data' ? 'text-[#1D4532]' : 'text-[#9CA3AF]'}`} />
          <span className="whitespace-nowrap">Dữ liệu nền</span>
        </Link>

        {/* Cấu hình hệ thống */}
        <Link
          to="/admin/settings"
          className={`relative flex items-center gap-3 px-3.5 h-11 rounded-lg transition-all duration-150 text-[14px] font-medium ${
            location.pathname === '/admin/settings'
              ? 'bg-[#EDF7F2] text-[#1D4532] font-semibold'
              : 'text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]'
          }`}
        >
          {location.pathname === '/admin/settings' && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1D4532] rounded-r-full" />
          )}
          <Settings className={`w-5 h-5 flex-shrink-0 ${location.pathname === '/admin/settings' ? 'text-[#1D4532]' : 'text-[#9CA3AF]'}`} />
          <span className="whitespace-nowrap">Cấu hình hệ thống</span>
        </Link>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
