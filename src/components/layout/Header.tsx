"use client";

import React from "react";
import { Search, Brain, Zap, ShieldAlert, Sparkles, Command } from "lucide-react";

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onOpenBrainDump: () => void;
  onTriggerWhatNow: () => void;
  onToggleOverwhelm: () => void;
}

export function Header({
  onOpenCommandPalette,
  onOpenBrainDump,
  onTriggerWhatNow,
  onToggleOverwhelm,
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-border/70 bg-card/40 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search / Command Launcher */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/60 text-xs text-muted-foreground hover:text-foreground transition-colors w-44 sm:w-64"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="truncate">Search or command...</span>
        <kbd className="hidden sm:inline-flex ml-auto text-[10px] font-mono bg-card px-1.5 py-0.2 rounded border border-border">
          ⌘K
        </kbd>
      </button>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Brain Dump Action */}
        <button
          type="button"
          onClick={onOpenBrainDump}
          className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border/80 text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Brain Dump (B)"
        >
          <Brain className="w-3.5 h-3.5 text-primary" />
          <span className="hidden sm:inline">Brain Dump</span>
        </button>

        {/* What Should I Do Now Action */}
        <button
          type="button"
          onClick={onTriggerWhatNow}
          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          title="Signature Recommendation Engine"
        >
          <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
          <span className="hidden md:inline">What Now?</span>
        </button>

        {/* Overwhelm Mode Action */}
        <button
          type="button"
          onClick={onToggleOverwhelm}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Overwhelm Mode"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline text-[11px]">Sanctuary</span>
        </button>
      </div>
    </header>
  );
}
