import { Bell, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  return (
    <header className="bg-card text-card-foreground border-b border-border h-12 flex-shrink-0">
      <div className="flex items-center justify-between px-4 h-full">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          {/* Logo - Vertical bars similar to Stackbox */}
          <div className="flex items-center space-x-0.5">
            <div className="w-0.5 h-4 bg-foreground opacity-50"></div>
            <div className="w-0.5 h-4 bg-foreground opacity-60"></div>
            <div className="w-0.5 h-4 bg-foreground opacity-70"></div>
            <div className="w-0.5 h-4 bg-foreground opacity-80"></div>
            <div className="w-0.5 h-4 bg-foreground opacity-90"></div>
            <div className="w-0.5 h-4 bg-foreground"></div>
          </div>

          {/* Title */}
          <h1 className="text-sm font-bold text-foreground">
            Shop Floor Digital Twin
          </h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notification Bell */}
          <button className="p-1 hover:bg-accent rounded transition-colors">
            <Bell size={14} className="text-muted-foreground" />
          </button>

          {/* User Avatar */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
              <User size={12} className="text-white" />
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Nestle-DC1
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
