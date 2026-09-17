"use client";

import React from "react";
import { Search, Brain, Zap, ShieldAlert } from "lucide-react";
import { SpiderLogo } from "@/components/icons/SpiderLogo";
import { useAuth } from "@/lib/auth/AuthContext";

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onOpenBrainDump: () => void;
  onTriggerWhatNow: () => void;
  onToggleOverwhelm: () => void;
  onOpenAuth?: () => void;
}

export function Header({
  onOpenCommandPalette,
  onOpenBrainDump,
  onTriggerWhatNow,
  onToggleOverwhelm,
  onOpenAuth,
}: HeaderProps) {
  const { user, firebaseUser } = useAuth();
  const avatarUrl = user?.avatar || firebaseUser?.photoURL;
  const displayName = user?.name || firebaseUser?.displayName || "Operator";

  return (
    <header className="h-14 border-b border-border/80 bg-card/75 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-all">
      {/* Mobile Brand & Global Command Search */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile-only logo */}
        <div className="flex items-center gap-2 md:hidden flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-rose-700 flex items-center justify-center text-white shadow-glow-crimson-sm border border-red-400/30">
            <SpiderLogo className="w-4 h-4 text-white fill-white" />
          </div>
        </div>

        {/* Global Search & Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/80 text-xs text-muted-foreground hover:text-foreground transition-all duration-150 shadow-2xs group"
        >
          <Search className="w-3.5 h-3.5 group-hover:text-primary transition-colors flex-shrink-0" />
          <span className="hidden sm:inline truncate text-left font-sans">Search or command...</span>
          <span className="inline sm:hidden text-[11px] font-sans">Search</span>
          <kbd className="hidden md:inline-flex ml-auto text-[10px] font-display font-bold bg-card px-1.5 py-0.5 rounded border border-border text-muted-foreground group-hover:border-primary/50 group-hover:text-foreground transition-colors">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Action Suite & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Brain Dump Action */}
        <button
          type="button"
          onClick={onOpenBrainDump}
          className="spider-btn-secondary spider-btn-sm px-2.5 sm:px-3"
          title="Brain Dump (B)"
        >
          <Brain className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="hidden sm:inline">Capture</span>
        </button>

        {/* What Should I Do Now (Signature Engine with Spider-Sense radar pulse) */}
        <button
          type="button"
          onClick={onTriggerWhatNow}
          className="spider-btn-primary spider-btn-sm px-2.5 sm:px-3.5"
          title="Spider-Sense Decision Engine (F)"
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          <Zap className="w-3.5 h-3.5 fill-current text-amber-300 group-hover:rotate-12 transition-transform flex-shrink-0" />
          <span className="hidden md:inline">What Now?</span>
        </button>

        {/* Overwhelm Sanctuary Trigger (desktop & tablet) */}
        <button
          type="button"
          onClick={onToggleOverwhelm}
          className="hidden sm:inline-flex spider-btn-secondary spider-btn-sm border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/60"
          title="Overwhelm Sanctuary"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline text-[11px]">Sanctuary</span>
        </button>

        {/* User Account Avatar (Shows Google/Gmail avatar with online status on both mobile and desktop) */}
        <button
          type="button"
          onClick={onOpenAuth}
          className="relative p-0.5 rounded-full hover:ring-2 hover:ring-primary/60 transition-all active:scale-95 flex-shrink-0 cursor-pointer ml-1"
          title={user ? `${displayName} (${user.email || firebaseUser?.email})` : "Account & Authentication"}
          aria-label="Account Settings"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/50 flex items-center justify-center text-xs font-display font-bold overflow-hidden shadow-glow-crimson-sm">
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
        </button>
      </div>
    </header>
  );
}
