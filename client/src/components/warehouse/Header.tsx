import { Bell, User } from "lucide-react";

export function Header() {
  return (
    <header className="bg-slate-800 text-white border-b border-slate-700">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          {/* Logo - Vertical bars similar to Stackbox */}
          <div className="flex items-center space-x-0.5">
            <div className="w-1 h-5 bg-white opacity-60"></div>
            <div className="w-1 h-5 bg-white opacity-70"></div>
            <div className="w-1 h-5 bg-white opacity-80"></div>
            <div className="w-1 h-5 bg-white opacity-90"></div>
            <div className="w-1 h-5 bg-white"></div>
            <div className="w-1 h-5 bg-white"></div>
          </div>
          
          {/* Title */}
          <h1 className="text-base font-medium text-white">
            Warehouse Visibility Demo
          </h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          <button className="p-2 hover:bg-slate-700 rounded-md transition-colors">
            <Bell size={16} className="text-slate-300" />
          </button>
          
          {/* User Avatar */}
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <span className="text-sm text-slate-300 hidden sm:inline">
              Demo User
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}