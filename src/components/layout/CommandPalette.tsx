"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Brain,
  Zap,
  Calendar,
  Compass,
  GraduationCap,
  BarChart3,
  Target,
  FileText,
  Sliders,
  X,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (actionId: string) => void;
}

export function CommandPalette({ isOpen, onClose, onAction }: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onAction("toggle_palette");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    { id: "what_now", label: "What Should I Do Now?", icon: Zap, group: "Engine" },
    { id: "new_task", label: "Create New Task (N)", icon: Plus, group: "Actions" },
    { id: "brain_dump", label: "Brain Dump → Structured Tasks (B)", icon: Brain, group: "Actions" },
    { id: "daily_review", label: "Daily Closeout Review", icon: FileText, group: "Actions" },
    { id: "nav_dashboard", label: "Go to Command Dashboard (T)", icon: Zap, group: "Navigation" },
    { id: "nav_tasks", label: "Go to Tasks Matrix", icon: Plus, group: "Navigation" },
    { id: "nav_planner", label: "Go to Daily & Weekly Planner (P)", icon: Calendar, group: "Navigation" },
    { id: "nav_university", label: "Go to University Workspace", icon: GraduationCap, group: "Navigation" },
    { id: "nav_learning", label: "Go to Learning Roadmaps", icon: Compass, group: "Navigation" },
    { id: "nav_projects", label: "Go to Projects", icon: Sliders, group: "Navigation" },
    { id: "nav_goals", label: "Go to Goal Hierarchy", icon: Target, group: "Navigation" },
    { id: "nav_analytics", label: "Go to Visual Analytics", icon: BarChart3, group: "Navigation" },
    { id: "nav_settings", label: "Open Settings & Profile", icon: Sliders, group: "Navigation" },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search header */}
        <div className="flex items-center px-4 py-3 border-b border-border gap-2.5">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to screen... (Esc to close)"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No matching commands.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onAction(item.id);
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-secondary flex items-center justify-between text-xs text-left transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
