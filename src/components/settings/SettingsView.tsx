"use client";

import React, { useState } from "react";
import { Settings, User, Sliders, Database, LogOut, Check, Loader2, Sparkles, AlertTriangle, Trash2, ShieldCheck, Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

export function SettingsView() {
  const { user, logout, loginDemo, isDemoUser, refreshProfile } = useAuth();
  const { apiFetch } = useApi();

  const [dailyHours, setDailyHours] = useState(user?.preferences?.dailyWorkHours || 5.5);
  const [theme, setTheme] = useState<"dark" | "light">(
    (user?.preferences?.theme as any) || "dark"
  );
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetting, setResetting] = useState(false);

  const isDemo =
    isDemoUser ||
    user?.firebaseUid?.startsWith("demo_") ||
    user?.email === "demo@personalos.local" ||
    user?.email?.includes("demo");

  async function handleSavePreferences(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await apiFetch("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({
        preferences: {
          dailyWorkHours: Number(dailyHours),
          theme,
        },
      }),
    });

    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Preferences updated successfully!");
      await refreshProfile();
      if (typeof document !== "undefined") {
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    }
  }

  async function handleSeedData() {
    if (!isDemo) {
      toast.error("Sample datasets can only be loaded in Dummy/Demo mode to protect your personal account data.");
      return;
    }

    if (
      !confirm(
        "This will initialize/replace sample University courses, Rover project, ROS2 learning roadmap, and test tasks for this demo workspace. Proceed?"
      )
    ) {
      return;
    }

    setSeeding(true);
    const { data, error } = await apiFetch("/api/seed", { method: "POST" });
    setSeeding(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(data?.message || "Sample engineering workspace seeded successfully!");
      window.location.reload();
    }
  }

  async function handleResetWorkspace() {
    if (resetConfirmation.trim() !== "RESET") {
      toast.error('Please type "RESET" in all caps to confirm.');
      return;
    }

    setResetting(true);
    const { data, error } = await apiFetch("/api/workspace/reset", {
      method: "POST",
      body: JSON.stringify({ confirmation: "RESET" }),
    });
    setResetting(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(data?.message || "Workspace reset successfully!");
      setResetModalOpen(false);
      setResetConfirmation("");
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
          <SpiderLogo className="w-4 h-4 text-primary" />
          Workspace Configuration
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings & Profile
        </h1>
      </div>

      {/* Profile & Account Info */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-specular-card space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          User Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground block mb-1 font-medium">Display Name</span>
            <span className="font-semibold text-foreground text-sm">{user?.name || "User"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1 font-medium">Account Email</span>
            <span className="font-display font-semibold text-foreground text-sm">{user?.email || "No email"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1 font-medium">Session Mode</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium text-[11px] border border-border/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {user ? "Firebase Google Authenticated" : "Not Signed In"}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-border/70 flex items-center gap-3">
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-secondary/70 hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors border border-border/70"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Workload Capacity & Theme Preferences */}
      <form onSubmit={handleSavePreferences} className="p-6 rounded-2xl bg-card border border-border/80 shadow-specular-card space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          Capacity & Appearance
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-muted-foreground mb-1">
              Target Daily Work Capacity (Hours)
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="16"
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value) || 5.5)}
              className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 font-medium"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Used by Workload Balancer to alert when a day exceeds realistic human limits.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-muted-foreground mb-1">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none"
            >
              <option value="dark">Spider-Man Obsidian Dark (Recommended)</option>
              <option value="light">Crisp Editorial Light</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-border/70 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-glow-crimson-sm border border-red-400/30 transition-all"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
            Save Preferences
          </button>
        </div>
      </form>

      {/* Sample Workspace Datasets Action - Only available on Demo accounts */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-specular-card space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Sample Workspace Datasets</h2>
          </div>
          {isDemo ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Demo Mode Active
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Demo Only
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Instantly populate the workspace with realistic engineering datasets: MTE 3101 & 3103 University courses, Mars Rover robotics project with dependency graph, ROS2 learning roadmap with subtopic trees, and urgent deadlines.
        </p>

        {isDemo ? (
          <button
            type="button"
            disabled={seeding}
            onClick={handleSeedData}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-2xs hover:border-primary/40"
          >
            {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
            Load Sample Engineering Dataset
          </button>
        ) : (
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Protected: Sample datasets are disabled on personal Google accounts to ensure your real tasks and roadmaps are never replaced.
              </span>
            </div>
            <button
              type="button"
              onClick={() => loginDemo("engineer")}
              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-[11px] font-semibold text-foreground border border-border/70 whitespace-nowrap self-start sm:self-auto"
            >
              Switch to Demo Mode
            </button>
          </div>
        )}
      </div>

      {/* Danger Zone: Reset Workspace */}
      <div className="p-6 rounded-2xl bg-card border border-red-500/30 shadow-specular-card space-y-3.5">
        <div className="flex items-center gap-2 text-red-400">
          <Trash2 className="w-4 h-4 text-red-400" />
          <h2 className="text-base font-bold text-foreground">Reset All Workspace Data</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Need a fresh start? Resetting your workspace permanently removes all tasks, courses, roadmaps, goals, and focus sessions associated with this account.
        </p>
        <button
          type="button"
          onClick={() => setResetModalOpen(true)}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Reset Workspace...
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-red-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-red-400">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-base font-bold text-foreground">Confirm Total Workspace Reset</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This action <span className="font-semibold text-red-400">cannot be undone</span>. All your active tasks, university courses, robotics projects, and learning roadmaps will be permanently deleted.
            </p>
            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-muted-foreground">
                Type <span className="text-red-400 font-mono font-bold">RESET</span> to confirm:
              </label>
              <input
                type="text"
                value={resetConfirmation}
                onChange={(e) => setResetConfirmation(e.target.value)}
                placeholder="RESET"
                className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-red-500/60"
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => {
                  setResetModalOpen(false);
                  setResetConfirmation("");
                }}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetConfirmation.trim() !== "RESET" || resetting}
                onClick={handleResetWorkspace}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-glow-crimson-sm"
              >
                {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Permanently Erase All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
