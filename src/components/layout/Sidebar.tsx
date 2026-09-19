"use client";

import React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Layers,
  Lightbulb,
  GraduationCap,
  BarChart3,
  FileCheck,
  Settings,
  Shield,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export function Sidebar({ currentTab, onSelectTab, onOpenAuth }: SidebarProps) {
  const { user, firebaseUser } = useAuth();
  const avatarUrl = user?.avatar || firebaseUser?.photoURL;
  const displayName = user?.name || firebaseUser?.displayName || "Operator";
  const displayEmail = user?.email || firebaseUser?.email || "Connected";
  const isAuthenticated = Boolean(user || firebaseUser);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "planner", label: "Planner", icon: Calendar },
    { id: "growth", label: "Growth & Projects", icon: Layers },
    { id: "ideas", label: "Idea Vault", icon: Lightbulb },
    { id: "university", label: "University", icon: GraduationCap },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "review", label: "Daily Review", icon: FileCheck },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  return (
    <aside className="w-64 border-r border-border/80 bg-card/75 backdrop-blur-2xl flex flex-col justify-between h-screen sticky top-0 select-none hidden md:flex z-30 transition-all">
      <div className="p-4 space-y-6">
        {/* Brand with Spider-Man Theme Emblem */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-red-600 to-rose-700 flex items-center justify-center text-white shadow-glow-crimson-sm border border-red-400/30 flex-shrink-0 group cursor-pointer transition-transform duration-200 hover:scale-105">
            <SpiderLogo className="w-5 h-5 text-white fill-white transition-transform group-hover:rotate-6" glow />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-display font-extrabold tracking-tight text-foreground flex items-center gap-1">
              Personal<span className="text-primary font-black">OS</span>
            </div>
            <div className="text-[10px] uppercase font-display font-bold tracking-widest text-muted-foreground flex items-center gap-1">
              <span>Command Center</span>
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-display transition-all relative group ${
                  isActive
                    ? "bg-primary/20 text-white font-bold border border-primary/40 shadow-glow-crimson-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 font-medium"
                }`}
              >
                {/* Active left indicator strand */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full shadow-glow-crimson" />
                )}
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <span className="tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User Profile / Sign In Card */}
      <div className="p-3 border-t border-border/80">
        {isAuthenticated ? (
          <div
            onClick={onOpenAuth}
            className="spider-card flex items-center justify-between p-2.5 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center text-xs font-display font-bold overflow-hidden shadow-xs">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    displayName.charAt(0) || "U"
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-card" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-display font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {displayName}
                </p>
                <p className="text-[10px] font-display text-muted-foreground truncate">
                  {displayEmail}
                </p>
              </div>
            </div>
            <Shield className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="spider-card w-full flex items-center justify-between p-2.5 cursor-pointer group hover:border-primary/60 transition-all border-primary/30 shadow-glow-crimson-sm text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center text-xs font-display font-bold">
                <LogIn className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-display font-bold text-foreground group-hover:text-primary transition-colors">
                  Sign In
                </p>
                <p className="text-[10px] font-display text-muted-foreground truncate">
                  Sync with Google
                </p>
              </div>
            </div>
            <span className="text-[10px] font-display font-bold text-primary uppercase tracking-wider">
              Enter →
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
