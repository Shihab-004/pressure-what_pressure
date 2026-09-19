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
  Layers,
  Lightbulb,
  Sliders,
  X,
  Sparkles,
} from "lucide-react";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

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
    { id: "what_now", label: "What Should I Do Now?", icon: Zap, group: "Engine", hint: "F" },
    { id: "new_task", label: "Create New Task", icon: Plus, group: "Actions", hint: "N" },
    { id: "brain_dump", label: "Brain Dump → Structured Tasks", icon: Brain, group: "Actions", hint: "B" },
    { id: "daily_review", label: "Daily Closeout Review", icon: FileText, group: "Actions", hint: "End of day" },
    { id: "nav_dashboard", label: "Command Dashboard", icon: Zap, group: "Navigation", hint: "T" },
    { id: "nav_tasks", label: "Tasks & Priority Registry", icon: Plus, group: "Navigation", hint: "" },
    { id: "nav_planner", label: "Daily & Weekly Planner", icon: Calendar, group: "Navigation", hint: "P" },
    { id: "nav_growth", label: "Growth & Projects Hub", icon: Layers, group: "Navigation", hint: "Projects & Skills" },
    { id: "nav_ideas", label: "Idea Vault & Innovation Lab", icon: Lightbulb, group: "Navigation", hint: "Sparks" },
    { id: "nav_university", label: "University Academic Workspace", icon: GraduationCap, group: "Navigation", hint: "Courses" },
    { id: "nav_analytics", label: "Performance & Estimation Analytics", icon: BarChart3, group: "Navigation", hint: "" },
    { id: "nav_settings", label: "Workspace Settings & Profile", icon: Sliders, group: "Navigation", hint: "" },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.group.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl spider-card shadow-2xl overflow-hidden flex flex-col animate-scaleIn">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3 bg-secondary/30">
          <Search className="w-4 h-4 text-primary flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search command or jump to screen... (Esc)"
            className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="text-[10px] font-display font-bold bg-secondary px-2 py-0.5 rounded border border-border text-muted-foreground hidden sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div className="max-h-84 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground font-display">
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
                  className="w-full p-2.5 rounded-lg hover:bg-secondary/80 flex items-center justify-between text-xs text-left transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-secondary text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-2xs group-hover:shadow-glow-crimson-sm">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-foreground truncate group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {item.hint && (
                      <kbd className="text-[10px] font-display font-bold bg-card px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                        {item.hint}
                      </kbd>
                    )}
                    <span className="text-[10px] text-muted-foreground/80 uppercase font-display font-bold tracking-wider">
                      {item.group}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-border/60 bg-secondary/20 flex items-center justify-between text-[11px] text-muted-foreground font-display">
          <div className="flex items-center gap-1.5">
            <SpiderLogo className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold">Spider Command Hub</span>
          </div>
          <span className="text-[10px]">Jump to screen or execute action</span>
        </div>
      </div>
    </div>
  );
}
