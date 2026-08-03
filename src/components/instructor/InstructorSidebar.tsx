import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
} from 'lucide-react';
import logo from '../../assets/logongangtachnen.png';

const navItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', href: '/instructor' },
  { icon: BookOpen, label: 'Quản lý Bài giảng', href: '/instructor/lessons' },
  { icon: Users, label: 'Theo dõi Học viên', href: '/instructor/students' },
  { icon: GraduationCap, label: 'Cấu trúc Giáo trình', href: '/instructor/media' },
];

const InstructorSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 py-8 w-64 bg-white/75 backdrop-blur-xl text-[#374151] border-r border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.06)] z-20">
      {/* Brand Header */}
      <div className="px-6 mb-8">
        <Link to="/" className="block">
          <img
            src={logo}
            alt="VietStage Logo"
            className="w-full h-auto max-h-14 object-contain hover:opacity-85 transition-opacity"
          />
        </Link>
        <p className="text-[12px] text-[#1D4532] uppercase tracking-widest mt-2.5 font-bold text-center">
          Cổng thông tin giảng viên
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`relative flex items-center gap-3 px-3.5 h-11 rounded-lg transition-all duration-150 text-[14px] font-medium ${isActive
                  ? 'bg-[#EDF7F2] text-[#1D4532] font-semibold'
                  : 'text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]'
                }`}
            >
              {/* Active green strip on left */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1D4532] rounded-r-full" />
              )}
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#1D4532]' : 'text-[#9CA3AF]'}`} />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
};

export default InstructorSidebar;
