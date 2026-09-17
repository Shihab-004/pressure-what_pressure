"use client";

import React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  GraduationCap,
  Plus,
  Compass,
  Settings,
} from "lucide-react";

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
}

export function MobileNav({ currentTab, onSelectTab, onOpenQuickAdd }: MobileNavProps) {
  const items = [
    { id: "dashboard", label: "Today", icon: LayoutDashboard },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "planner", label: "Plan", icon: Calendar },
    { id: "university", label: "Uni", icon: GraduationCap },
    { id: "settings", label: "More", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border px-3 py-1.5 flex items-center justify-around safe-area-bottom">
      {items.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        );
      })}

      {/* Center Floating Quick Add Action */}
      <button
        type="button"
        onClick={onOpenQuickAdd}
        className="w-11 h-11 -mt-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform"
        title="Quick Add Task"
      >
        <Plus className="w-5 h-5" />
      </button>

      {items.slice(2).map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
