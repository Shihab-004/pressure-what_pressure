"use client";

import React, { useState } from "react";
import { Settings, User, Sliders, Database, LogOut, Check, Loader2, Sparkles } from "lucide-react";
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
    if (
      !confirm(
        "This will initialize/replace sample University courses, Rover project, ROS2 learning roadmap, and test tasks for your workspace. Proceed?"
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

      {/* Development Seed Data Action */}
      <div className="p-6 rounded-2xl bg-card border border-primary/30 shadow-specular-card space-y-3.5">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Sample Workspace Datasets</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Instantly populate your account with realistic engineering datasets: MTE 3101 & 3103 University courses, Mars Rover robotics project with dependency graph, ROS2 learning roadmap with subtopic trees, historical focus sessions, and urgent deadlines.
        </p>
        <button
          type="button"
          disabled={seeding}
          onClick={handleSeedData}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-2xs hover:border-primary/40"
        >
          {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
          Load Sample Engineering Dataset
        </button>
      </div>
    </div>
  );
}
