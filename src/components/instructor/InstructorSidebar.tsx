import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Music,
} from 'lucide-react';
import logo from '../../assets/logongangtachnen.png';

const navItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', href: '/instructor' },
  { icon: BookOpen, label: 'Quản lý Bài giảng', href: '/instructor/lessons' },
  { icon: Users, label: 'Theo dõi Học viên', href: '/instructor/students' },
  { icon: Music, label: 'Thư viện Media', href: '/instructor/media' },
];

const InstructorSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 py-10 w-64 bg-primary-container text-on-primary border-r border-on-secondary-fixed-variant shadow-sm z-50">
      {/* Brand Header */}
      <div className="px-lg mb-12">
        <Link to="/" className="block">
          <img
            src={logo}
            alt="VietStage Logo"
            className="w-full h-auto max-h-16 object-contain hover:opacity-85 transition-opacity"
          />
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
    </aside>
  );
};

export default InstructorSidebar;
