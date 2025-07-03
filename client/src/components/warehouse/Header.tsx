import { Bell, User } from "lucide-react";

export function Header() {
  return (
    <header className="bg-[hsl(210,24%,16%)] text-white border-b border-[hsl(215,25%,27%)] h-12 flex-shrink-0">
      <div className="flex items-center justify-between px-4 h-full">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          {/* Logo - Vertical bars similar to Stackbox */}
          <div className="flex items-center space-x-0.5">
            <div className="w-0.5 h-4 bg-white opacity-50"></div>
            <div className="w-0.5 h-4 bg-white opacity-60"></div>
            <div className="w-0.5 h-4 bg-white opacity-70"></div>
            <div className="w-0.5 h-4 bg-white opacity-80"></div>
            <div className="w-0.5 h-4 bg-white opacity-90"></div>
            <div className="w-0.5 h-4 bg-white"></div>
          </div>
          
          {/* Title */}
          <h1 className="text-sm font-normal text-white">
            Warehouse Visibility Demo
          </h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          <button className="p-1 hover:bg-slate-600 rounded transition-colors">
            <Bell size={14} className="text-slate-300" />
          </button>
          
          {/* User Avatar */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
              <User size={12} className="text-white" />
            </div>
            <span className="text-xs text-slate-300 hidden sm:inline">
              Demo
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}