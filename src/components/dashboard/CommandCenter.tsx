"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Play,
  Clock,
  Calendar,
  AlertTriangle,
  Target,
  ArrowRight,
  Flame,
  Star,
  Bot,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { ITask, IGoal } from "@/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { useApi } from "@/lib/api/useApi";
import { formatMinutes, formatDateLabel } from "@/lib/utils";
import { SpiderLogo } from "@/components/icons/SpiderLogo";
import { format } from "date-fns";
import { taskSync } from "@/lib/events/taskSync";

interface CommandCenterProps {
  onTriggerWhatShouldIDo: () => void;
  onStartFocus: (task: ITask) => void;
  onOpenOverwhelm: () => void;
  onNavigateTab: (tab: string) => void;
}

export function CommandCenter({
  onTriggerWhatShouldIDo,
  onStartFocus,
  onOpenOverwhelm,
  onNavigateTab,
}: CommandCenterProps) {
  const { user } = useAuth();
  const { apiFetch } = useApi();

  const [loading, setLoading] = useState(true);
  const [todayData, setTodayData] = useState<any>(null);
  const [attentionData, setAttentionData] = useState<{
    overdueCount: number;
    carriedOverCount: number;
    deadlinesThisWeek: number;
  }>({ overdueCount: 0, carriedOverCount: 0, deadlinesThisWeek: 0 });
  const [currentGoal, setCurrentGoal] = useState<IGoal | null>(null);

  useEffect(() => {
    loadDashboardData();
    const unsubscribe = taskSync.subscribe(() => {
      loadDashboardData(true);
    });
    return unsubscribe;
  }, []);

  async function loadDashboardData(silent = false) {
    if (!silent) setLoading(true);

    // Fetch all dashboard data concurrently in parallel
    const [todayRes, overdueRes, tasksRes, goalsRes] = await Promise.all([
      apiFetch("/api/tasks/today"),
      apiFetch("/api/tasks/overdue"),
      apiFetch("/api/tasks"),
      apiFetch("/api/goals"),
    ]);

    // 1. Set today's data
    if (todayRes.data) {
      setTodayData(todayRes.data);
    }

    // 2. Set overdue & attention data
    if (tasksRes.data?.tasks) {
      const all: ITask[] = tasksRes.data.tasks;
      const carried = all.filter((t) => (t.carryOverCount || 0) > 0 && t.status !== "completed");
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const deadlines = all.filter(
        (t) =>
          t.deadline &&
          t.status !== "completed" &&
          new Date(t.deadline) <= nextWeek &&
          new Date(t.deadline) >= new Date()
      );

      setAttentionData({
        overdueCount: overdueRes.data?.totalCount || 0,
        carriedOverCount: carried.length,
        deadlinesThisWeek: deadlines.length,
      });
    }

    // 3. Set active goal
    if (goalsRes.data?.goals && goalsRes.data.goals.length > 0) {
      const active = goalsRes.data.goals.find((g: any) => g.status === "active");
      setCurrentGoal(active || goalsRes.data.goals[0]);
    }

    if (!silent) setLoading(false);
  }

  // Workload calculations
  const workload = todayData?.workload;
  const plannedMin = workload?.totalPlannedMinutes || 0;
  const availMin = workload?.availableMinutes || 330;
  const workloadPct = availMin > 0 ? Math.min(100, Math.round((plannedMin / availMin) * 100)) : 0;
  const isOverloaded = workload?.isOverloaded || false;

  const todayFormatted = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner & Greetings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="text-[11px] font-display font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary inline-block shadow-glow-crimson animate-pulse" />
            <span className="hidden sm:inline">EXECUTIVE BRIEF · </span>
            <span>{todayFormatted}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Welcome back, <span className="text-foreground">{user?.name?.split(" ")[0] || "Operator"}</span>
          </h1>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ordered Action Plan (DO FIRST, NEXT, THEN, OPTIONAL) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <SpiderLogo className="w-3.5 h-3.5 text-primary" />
              Execution Sequence
            </h2>
            <button
              onClick={() => loadDashboardData()}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-primary" : ""}`} />
              Sync
            </button>
          </div>

          {/* DO FIRST (Hero Signature Card) */}
          {todayData?.doFirst ? (
            <div className="spider-hero-card p-5 sm:p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 text-xs font-display font-bold text-amber-400 uppercase tracking-wider">
                  <Flame className="w-4 h-4 fill-current text-amber-400" />
                  <span>DO FIRST</span>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary/80 text-foreground font-medium border border-border">
                  {todayData.doFirst.category}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-display font-bold text-foreground leading-snug mb-2 group-hover:text-white transition-colors">
                {todayData.doFirst.title}
              </h3>

              {todayData.doFirst.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                  {todayData.doFirst.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-muted-foreground flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 font-display tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    Est: {formatMinutes(todayData.doFirst.estimatedMinutes || 45)}
                  </span>
                  {todayData.doFirst.deadline && (
                    <span className="flex items-center gap-1.5 text-amber-400 font-display font-medium tabular-nums">
                      <Calendar className="w-3.5 h-3.5" />
                      Due: {formatDateLabel(todayData.doFirst.deadline)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onStartFocus(todayData.doFirst)}
                  className="spider-btn-primary spider-btn-sm w-full sm:w-auto"
                >
                  <Play className="w-3 h-3 fill-current" />
                  START FOCUS
                </button>
              </div>
            </div>
          ) : (
            <div className="spider-card p-8 text-center space-y-2.5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-display font-bold text-foreground">Zero Critical Bottlenecks</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No immediate tasks scheduled for today. Tap the (+) button to create a new target.
              </p>
            </div>
          )}

          {/* NEXT */}
          {todayData?.nextTask && (
            <div className="spider-card p-4 flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-display font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    NEXT
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
                    {todayData.nextTask.category}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-foreground truncate">
                  {todayData.nextTask.title}
                </h4>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
                <span className="font-display font-semibold tabular-nums text-[11px]">{formatMinutes(todayData.nextTask.estimatedMinutes || 45)}</span>
                <button
                  type="button"
                  onClick={() => onStartFocus(todayData.nextTask)}
                  className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-white text-foreground transition-all shadow-2xs"
                  title="Start Focus"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          )}

          {/* THEN */}
          {todayData?.thenTask && (
            <div className="spider-card p-4 flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    THEN
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
                    {todayData.thenTask.category}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-foreground truncate">
                  {todayData.thenTask.title}
                </h4>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
                <span className="font-display font-semibold tabular-nums text-[11px]">{formatMinutes(todayData.thenTask.estimatedMinutes || 45)}</span>
                <button
                  type="button"
                  onClick={() => onStartFocus(todayData.thenTask)}
                  className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-white text-foreground transition-all shadow-2xs"
                  title="Start Focus"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          )}

          {/* OPTIONAL */}
          {todayData?.optionalTasks && todayData.optionalTasks.length > 0 && (
            <div className="spider-card p-4 border-dashed space-y-2.5">
              <div className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-primary" />
                OPTIONAL ({todayData.optionalTasks.length})
              </div>
              <div className="space-y-1.5">
                {todayData.optionalTasks.map((t: any) => (
                  <div key={t._id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-secondary/40 transition-colors">
                    <span className="text-muted-foreground truncate max-w-sm">{t.title}</span>
                    <span className="text-muted-foreground/80 font-display font-semibold tabular-nums text-[11px]">
                      {formatMinutes(t.estimatedMinutes || 30)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Command Signals (Workload, Attention, Goal, Overwhelm) */}
        <div className="space-y-4">
          {/* Today's Workload Capacity Gauge */}
          <div className="spider-card p-5 space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Capacity Gauge
              </span>
              <span
                className={`font-display font-bold tabular-nums ${
                  isOverloaded ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {formatMinutes(plannedMin)} / {formatMinutes(availMin)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverloaded ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-glow-crimson-sm" : "bg-gradient-to-r from-primary to-rose-500"
                }`}
                style={{ width: `${Math.min(100, workloadPct)}%` }}
              />
            </div>

            {isOverloaded ? (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-red-200">Capacity exceeded.</p>
                  <p className="text-[11px] text-red-300/80 font-display tabular-nums">
                    Over allocated by {formatMinutes(plannedMin - availMin)}.
                  </p>
                  <button
                    onClick={() => onNavigateTab("planner")}
                    className="text-[11px] font-semibold text-red-400 hover:text-red-300 underline block"
                  >
                    Open Daily Planner to Balance
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Workload balanced within your {user?.preferences?.dailyWorkHours || 5.5}h capacity.
              </p>
            )}
          </div>

          {/* Attention Signals with Spider-Sense Highlights */}
          <div className="spider-card p-5 space-y-3">
            <div className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Critical Attention</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Deadlines this week</span>
                <span className="font-display font-bold tabular-nums text-foreground">{attentionData.deadlinesThisWeek}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Overdue tasks</span>
                <span
                  className={`font-display font-bold tabular-nums ${
                    attentionData.overdueCount > 0 ? "text-red-400" : "text-foreground"
                  }`}
                >
                  {attentionData.overdueCount}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Carried-over tasks</span>
                <span className="font-display font-bold tabular-nums text-amber-400">{attentionData.carriedOverCount}</span>
              </div>
            </div>
          </div>

          {/* Current Goal Progress */}
          {currentGoal && (
            <div
              onClick={() => onNavigateTab("growth")}
              className="spider-card p-5 space-y-3 cursor-pointer hover:border-primary/50 transition-all"
              title="Click to view all goals and projects"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  Active Target
                </span>
                <span className="font-display tabular-nums text-xs font-bold text-primary">
                  {currentGoal.progress}%
                </span>
              </div>

              <h4 className="text-xs font-semibold text-foreground leading-snug">
                {currentGoal.title}
              </h4>

              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 shadow-glow-crimson-sm"
                  style={{ width: `${currentGoal.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* CALM MODE (DE-STRESS ACTION) */}
          <button
            type="button"
            onClick={onOpenOverwhelm}
            className="spider-btn-secondary w-full py-3 px-4 border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/60 flex items-center justify-center gap-2 group"
            title="Calm Mode: Hide all clutter and focus on 2-3 vital tasks"
          >
            <ShieldAlert className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Calm Mode (De-Stress)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
