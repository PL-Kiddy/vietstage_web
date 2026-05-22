import { Search, Bell, HelpCircle } from 'lucide-react';

interface AdminTopbarProps {
  userName?: string;
  userRole?: string;
}

const AdminTopbar = ({
  userName = 'Admin Name',
  userRole = 'Administrator',
}: AdminTopbarProps) => {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-10 flex justify-between items-center h-16 px-lg bg-[#f7f9ff]/95 backdrop-blur-sm border-b border-[#d1e4fb]">
      {/* Search */}
      <div className="flex items-center gap-md bg-[#edf4ff] px-md py-xs rounded-full border border-outline/10 w-96 focus-within:ring-1 focus-within:ring-primary transition-all">
        <Search className="w-5 h-5 text-[#5e5e5b]" />
        <input
          type="text"
          placeholder="Tìm kiếm dữ liệu hệ thống..."
          className="bg-transparent border-none focus:ring-0 focus:outline-none text-body-md w-full placeholder:text-[#5e5e5b]/60"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-lg">
        <div className="flex items-center gap-md">
          <button className="relative text-[#5e5e5b] hover:text-primary transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-[#f7f9ff]" />
          </button>
          <button className="text-[#5e5e5b] hover:text-primary transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="h-8 w-px bg-[#d1e4fb]" />

        {/* User Profile */}
        <div className="flex items-center gap-sm">
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
      </div>
    </header>
  );
};

export default AdminTopbar;
