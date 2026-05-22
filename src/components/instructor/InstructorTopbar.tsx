import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';

const InstructorTopbar = () => {
  return (
    <header className="flex justify-between items-center h-16 px-margin-desktop md:ml-72 w-[calc(100%-18rem)] fixed top-0 bg-surface border-b border-outline-variant/10 shadow-sm z-40">
      <div className="flex items-center gap-lg w-full max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Tìm kiếm bài giảng, học viên..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-secondary text-body-md font-body-md outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-md">
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-outline-variant/30 mx-2" />
        <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary text-xs">
          TH
        </div>
      </div>
    </header>
  );
};

export default InstructorTopbar;
