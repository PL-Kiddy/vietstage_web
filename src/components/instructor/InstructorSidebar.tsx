import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Music,
  Home,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', href: '/instructor' },
  { icon: BookOpen, label: 'Quản lý Bài giảng', href: '/instructor/lessons' },
  { icon: Users, label: 'Theo dõi Học viên', href: '/instructor/students' },
  { icon: Music, label: 'Thư viện Media', href: '/instructor/media' },
];

const InstructorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 py-10 w-64 bg-primary-container text-on-primary border-r border-on-secondary-fixed-variant shadow-sm z-50">
      {/* Brand Header */}
      <div className="px-lg mb-12">
        <Link to="/" className="block">
          <span className="text-[22px] font-bold tracking-widest text-[#ffe088] font-sans hover:opacity-85 transition-opacity">
            VIETSTAGE
          </span>
        </Link>
        <p className="text-[11px] opacity-80 uppercase tracking-widest mt-xs font-medium">
          Cổng thông tin giảng viên
        </p>
      </div>

      {/* Navigation Links */}
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

      {/* Bottom Profile / Home Info */}
      <div className="px-md mt-auto pt-lg border-t border-on-primary/10 flex flex-col gap-sm">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-sm px-lg py-md text-on-primary/80 hover:text-on-primary hover:bg-on-primary-fixed-variant/50 transition-colors duration-200 rounded-lg text-left"
        >
          <Home className="w-5 h-5" />
          <span className="text-body-md">Quay lại trang chủ</span>
        </button>
      </div>
    </aside>
  );
};

export default InstructorSidebar;
