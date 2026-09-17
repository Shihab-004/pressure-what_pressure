"use client";

import React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  FolderKanban,
  Compass,
  Target,
  GraduationCap,
  BarChart3,
  FileCheck,
  Settings,
  Zap,
  Shield,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export function Sidebar({ currentTab, onSelectTab, onOpenAuth }: SidebarProps) {
  const { user, isDemoUser } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "planner", label: "Planner", icon: Calendar },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "learning", label: "Learning", icon: Compass },
    { id: "goals", label: "Goals", icon: Target },
    { id: "university", label: "University", icon: GraduationCap },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "review", label: "Daily Review", icon: FileCheck },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-xl flex flex-col justify-between h-screen sticky top-0 select-none hidden md:flex">
      <div className="p-4 space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-sky-400 flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
              Personal<span className="text-primary">OS</span>
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
              Command Center
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User Info */}
      <div className="p-4 border-t border-border/80">
        <div
          onClick={onOpenAuth}
          className="flex items-center justify-between p-2 rounded-xl bg-secondary/40 hover:bg-secondary cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || "U"
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.name || "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {isDemoUser ? "Local Workspace" : user?.email}
              </p>
            </div>
          </div>
          <Shield className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
