"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  LayoutGrid,
  Plus,
  GraduationCap,
  FolderKanban,
  Compass,
  Target,
  BarChart3,
  FileCheck,
  Settings,
  X,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
  onOpenAuth?: () => void;
}

export function MobileNav({
  currentTab,
  onSelectTab,
  onOpenQuickAdd,
  onOpenAuth,
}: MobileNavProps) {
  const [isHubOpen, setIsHubOpen] = useState(false);
  const { user, firebaseUser, isDemoUser } = useAuth();

  const avatarUrl = user?.avatar || firebaseUser?.photoURL;
  const displayName = user?.name || firebaseUser?.displayName || "Operator";
  const displayEmail = user?.email || firebaseUser?.email || "Connected";

  // Check if current tab is one of the secondary Hub sections
  const isHubActive = [
    "university",
    "projects",
    "learning",
    "goals",
    "analytics",
    "review",
    "settings",
  ].includes(currentTab);

  const hubItems = [
    { id: "university", label: "University", desc: "Courses & Exams", icon: GraduationCap },
    { id: "projects", label: "Projects", desc: "Pipelines & Work", icon: FolderKanban },
    { id: "learning", label: "Learning", desc: "Roadmaps & Skills", icon: Compass },
    { id: "goals", label: "Goals", desc: "Target Hierarchy", icon: Target },
    { id: "analytics", label: "Analytics", desc: "Time & Variance", icon: BarChart3 },
    { id: "review", label: "Daily Review", desc: "Evening Closeout", icon: FileCheck },
    { id: "settings", label: "Settings", desc: "Preferences", icon: Settings },
  ];

  return (
    <>
      {/* 5-Column Navigation Bar (Col 3 is perfectly centered at 50% screen width) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-2xl border-t border-border/80 px-2 py-1.5 shadow-2xl safe-area-bottom">
        <div className="grid grid-cols-5 items-center w-full max-w-md mx-auto">
          {/* Column 1: Today */}
          <button
            type="button"
            onClick={() => {
              setIsHubOpen(false);
              onSelectTab("dashboard");
            }}
            className={`flex flex-col items-center justify-center py-1 min-h-[44px] text-[10px] font-medium transition-all relative ${
              currentTab === "dashboard" && !isHubOpen
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard
              className={`w-4 h-4 transition-transform ${
                currentTab === "dashboard" && !isHubOpen ? "scale-110 text-primary" : ""
              }`}
            />
            <span className="mt-1 font-display tracking-tight">Today</span>
            {currentTab === "dashboard" && !isHubOpen && (
              <span className="absolute bottom-0 w-4 h-0.5 bg-primary rounded-full shadow-glow-crimson" />
            )}
          </button>

          {/* Column 2: Tasks */}
          <button
            type="button"
            onClick={() => {
              setIsHubOpen(false);
              onSelectTab("tasks");
            }}
            className={`flex flex-col items-center justify-center py-1 min-h-[44px] text-[10px] font-medium transition-all relative ${
              currentTab === "tasks" && !isHubOpen
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckSquare
              className={`w-4 h-4 transition-transform ${
                currentTab === "tasks" && !isHubOpen ? "scale-110 text-primary" : ""
              }`}
            />
            <span className="mt-1 font-display tracking-tight">Tasks</span>
            {currentTab === "tasks" && !isHubOpen && (
              <span className="absolute bottom-0 w-4 h-0.5 bg-primary rounded-full shadow-glow-crimson" />
            )}
          </button>

          {/* Column 3: DEAD-CENTER Floating Quick Add Action Button */}
          <div className="flex items-center justify-center relative">
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="w-13 h-13 -mt-6 rounded-full bg-gradient-to-tr from-primary via-red-600 to-rose-600 hover:from-primary/90 hover:to-rose-500 text-white flex items-center justify-center shadow-glow-crimson border-4 border-card active:scale-90 hover:scale-105 transition-all cursor-pointer select-none"
              aria-label="Create New Task"
              title="Quick Add Task"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>

          {/* Column 4: Planner */}
          <button
            type="button"
            onClick={() => {
              setIsHubOpen(false);
              onSelectTab("planner");
            }}
            className={`flex flex-col items-center justify-center py-1 min-h-[44px] text-[10px] font-medium transition-all relative ${
              currentTab === "planner" && !isHubOpen
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar
              className={`w-4 h-4 transition-transform ${
                currentTab === "planner" && !isHubOpen ? "scale-110 text-primary" : ""
              }`}
            />
            <span className="mt-1 font-display tracking-tight">Plan</span>
            {currentTab === "planner" && !isHubOpen && (
              <span className="absolute bottom-0 w-4 h-0.5 bg-primary rounded-full shadow-glow-crimson" />
            )}
          </button>

          {/* Column 5: Hub / More Menu */}
          <button
            type="button"
            onClick={() => setIsHubOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center py-1 min-h-[44px] text-[10px] font-medium transition-all relative ${
              isHubOpen || isHubActive
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid
              className={`w-4 h-4 transition-transform ${
                isHubOpen || isHubActive ? "scale-110 text-primary" : ""
              }`}
            />
            <span className="mt-1 font-display tracking-tight">Hub</span>
            {(isHubOpen || isHubActive) && (
              <span className="absolute bottom-0 w-4 h-0.5 bg-primary rounded-full shadow-glow-crimson" />
            )}
          </button>
        </div>
      </nav>

      {/* Slide-Up Mobile Hub Bottom Sheet */}
      {isHubOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsHubOpen(false)}
          />

          {/* Sheet Body */}
          <div className="relative z-10 w-full bg-card/98 border-t border-border/80 rounded-t-3xl shadow-2xl p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp">
            {/* Sheet Handle */}
            <div className="w-12 h-1 rounded-full bg-muted mx-auto" />

            {/* Header with Title and Close */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <SpiderLogo className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-display font-extrabold tracking-tight text-foreground uppercase">
                  Command Hub
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHubOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Active Account Banner / Sign In Banner */}
            {user || firebaseUser ? (
              <div
                onClick={() => {
                  setIsHubOpen(false);
                  onOpenAuth?.();
                }}
                className="spider-card p-3 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all active:scale-98"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center text-sm font-display font-bold overflow-hidden shadow-glow-crimson-sm">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        displayName.charAt(0) || "U"
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-display font-bold text-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] font-display text-muted-foreground truncate">
                      {displayEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-primary font-display font-bold flex-shrink-0">
                  <span>Account</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setIsHubOpen(false);
                  onOpenAuth?.();
                }}
                className="spider-card p-3 flex items-center justify-between cursor-pointer hover:border-primary/60 transition-all active:scale-98 border-primary/40 shadow-glow-crimson-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center">
                    <LogIn className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-display font-bold text-foreground">
                      Sign In to Workspace
                    </p>
                    <p className="text-[11px] font-display text-muted-foreground">
                      Sync with Google Account
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="spider-btn-primary spider-btn-sm text-[11px] py-1.5 px-3"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Hub Navigation Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {hubItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      setIsHubOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all active:scale-95 ${
                      isActive
                        ? "bg-primary/15 border-primary/40 text-primary font-bold shadow-glow-crimson-sm"
                        : "bg-secondary/40 border-border/70 hover:bg-secondary/80 text-foreground"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isActive ? "bg-primary text-white" : "bg-card text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-display font-bold truncate">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
