import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';

interface AdminTopbarProps {
  userName?: string;
  userRole?: string;
}

const AdminTopbar = ({
  userName = 'Admin Name',
  userRole = 'Administrator',
}: AdminTopbarProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-10 flex justify-between items-center h-16 px-lg bg-[#f7f9ff]/95 backdrop-blur-sm border-b border-[#d1e4fb]">
      {/* Search */}
      <div className="flex items-center gap-md bg-[#edf4ff] px-md py-xs rounded-full border border-outline/10 w-96 focus-within:ring-1 focus-within:ring-primary transition-all">
        <Search className="w-5 h-5 text-[#5e5e5b]" />
        <input
          type="text"
          placeholder="Tìm kiếm dữ liệu hệ thống..."
          className="bg-transparent border-none focus:ring-0 focus:outline-outline text-body-md w-full placeholder:text-[#5e5e5b]/60"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-lg">
        <div className="flex items-center gap-md">
          <button className="relative text-[#5e5e5b] hover:text-primary transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-[#f7f9ff]" />
          </button>
        </div>

        <div className="h-8 w-px bg-[#d1e4fb]" />

        {/* User Profile */}
        <div className="relative">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-sm cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="text-right">
              <p className="font-label-md text-label-md text-on-surface">
                {userName}
              </p>
              <p className="text-[10px] text-[#5e5e5b] uppercase tracking-widest">
                {userRole}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border border-primary/20 bg-[#e3efff] flex items-center justify-center text-primary font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#d1e4fb] rounded-xl shadow-lg py-1 z-20">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/admin/profile');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#edf4ff] text-[14px] text-on-surface transition-colors"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#edf4ff] text-[14px] text-error transition-colors border-t border-[#d1e4fb]/40"
                >
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
