import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Music,
  User,
  LogOut,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', href: '/instructor' },
  { icon: BookOpen, label: 'Quản lý Bài giảng', href: '/instructor/lessons' },
  { icon: Users, label: 'Theo dõi Học viên', href: '/instructor/students' },
  { icon: Music, label: 'Thư viện Media', href: '/instructor/media' },
  { icon: User, label: 'Hồ sơ cá nhân', href: '/instructor/profile' },
];

const InstructorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 py-lg px-md bg-primary w-72 border-r border-outline-variant/10 shadow-sm z-50">
      {/* Brand Header */}
      <div className="mb-xl px-sm">
        <h1 className="font-display-lg text-[40px] leading-tight text-[#ffe088] font-bold tracking-tight">
          VietStage
        </h1>
        <p className="font-label-md text-label-md text-on-primary/60">
          Cổng thông tin giảng viên
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-sm">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-md py-md px-md transition-all duration-200 rounded-lg ${
                isActive
                  ? 'bg-secondary/10 text-[#ffe088] font-semibold border-r-4 border-[#ffe088]'
                  : 'text-on-primary/70 hover:text-on-primary hover:bg-primary-fixed-dim/10'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile / Logout Info */}
      <div className="mt-auto flex flex-col gap-md">
        <div className="flex items-center gap-md p-md bg-primary-container/20 rounded-xl">
          <div className="w-10 h-10 rounded-full border-2 border-secondary-fixed/30 bg-[#ffe088] text-primary font-bold flex items-center justify-center">
            TH
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-primary font-bold">
              NSND Thanh Hải
            </p>
            <p className="font-label-sm text-label-sm text-on-primary/60">
              Giảng viên cao cấp
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-md text-on-primary/70 hover:text-on-primary hover:bg-primary-fixed-dim/10 py-md px-md transition-all duration-200 rounded-lg w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-label-md text-label-md">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default InstructorSidebar;
