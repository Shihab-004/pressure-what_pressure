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
  Zap,
} from "lucide-react";
import { ITask, IGoal } from "@/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { useApi } from "@/lib/api/useApi";
import { formatMinutes, formatDateLabel } from "@/lib/utils";
import { QuickAddBar } from "@/components/tasks/QuickAddBar";
import { format } from "date-fns";

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
  }, []);

  async function loadDashboardData() {
    setLoading(true);

    // 1. Load today's tasks
    const todayRes = await apiFetch("/api/tasks/today");
    if (todayRes.data) {
      setTodayData(todayRes.data);
    }

    // 2. Load overdue & attention
    const overdueRes = await apiFetch("/api/tasks/overdue");
    const tasksRes = await apiFetch("/api/tasks");
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

    // 3. Load active goals
    const goalsRes = await apiFetch("/api/goals");
    if (goalsRes.data?.goals && goalsRes.data.goals.length > 0) {
      const active = goalsRes.data.goals.find((g: any) => g.status === "active");
      setCurrentGoal(active || goalsRes.data.goals[0]);
    }

    setLoading(false);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            TODAY · {todayFormatted}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Good day, {user?.name?.split(" ")[0] || "Maker"}
          </h1>
        </div>

        {/* Big Action: WHAT SHOULD I DO NOW */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onTriggerWhatShouldIDo}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Zap className="w-4 h-4 fill-current text-amber-300" />
            What Should I Do Now?
          </button>
        </div>
      </div>

      {/* Quick Add Bar */}
      <div className="bg-card/40 border border-border/80 rounded-xl p-2.5 backdrop-blur-sm shadow-sm">
        <QuickAddBar onTaskCreated={loadDashboardData} />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ordered Action Plan (DO FIRST, NEXT, THEN, OPTIONAL) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              Today's Execution Sequence
            </h2>
            <button
              onClick={loadDashboardData}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-primary" : ""}`} />
              Refresh
            </button>
          </div>

          {/* DO FIRST (Signature Card) */}
          {todayData?.doFirst ? (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-card to-secondary/40 border border-primary/40 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Flame className="w-4 h-4 fill-current" />
                  DO FIRST
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground/80 border border-border">
                  {todayData.doFirst.category}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-foreground leading-snug mb-1.5">
                {todayData.doFirst.title}
              </h3>

              {todayData.doFirst.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  {todayData.doFirst.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    Est: {formatMinutes(todayData.doFirst.estimatedMinutes || 45)}
                  </span>
                  {todayData.doFirst.deadline && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Due: {formatDateLabel(todayData.doFirst.deadline)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onStartFocus(todayData.doFirst)}
                  className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  START FOCUS
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-card border border-border text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-medium text-foreground">No tasks scheduled for today.</p>
              <p className="text-xs text-muted-foreground">
                You're all clear! Use Quick Add or the Planner to schedule work.
              </p>
            </div>
          )}

          {/* NEXT */}
          {todayData?.nextTask && (
            <div className="p-4 rounded-xl bg-card/60 border border-border/70 hover:border-border transition-all flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    NEXT
                  </span>
                  <span className="text-[11px] px-1.5 py-0.2 rounded bg-secondary text-muted-foreground">
                    {todayData.nextTask.category}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-foreground truncate">
                  {todayData.nextTask.title}
                </h4>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
                <span>{formatMinutes(todayData.nextTask.estimatedMinutes || 45)}</span>
                <button
                  type="button"
                  onClick={() => onStartFocus(todayData.nextTask)}
                  className="p-1.5 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          )}

          {/* THEN */}
          {todayData?.thenTask && (
            <div className="p-4 rounded-xl bg-card/40 border border-border/60 hover:border-border transition-all flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    THEN
                  </span>
                  <span className="text-[11px] px-1.5 py-0.2 rounded bg-secondary text-muted-foreground">
                    {todayData.thenTask.category}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-foreground truncate">
                  {todayData.thenTask.title}
                </h4>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
                <span>{formatMinutes(todayData.thenTask.estimatedMinutes || 45)}</span>
                <button
                  type="button"
                  onClick={() => onStartFocus(todayData.thenTask)}
                  className="p-1.5 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          )}

          {/* OPTIONAL */}
          {todayData?.optionalTasks && todayData.optionalTasks.length > 0 && (
            <div className="p-3.5 rounded-xl bg-card/30 border border-dashed border-border/60 space-y-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                OPTIONAL ({todayData.optionalTasks.length})
              </div>
              <div className="space-y-1">
                {todayData.optionalTasks.map((t: any) => (
                  <div key={t._id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-muted-foreground truncate max-w-sm">{t.title}</span>
                    <span className="text-muted-foreground/80 font-mono text-[11px]">
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
          {/* Today's Workload Gauge */}
          <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                Today's Workload
              </span>
              <span
                className={`font-mono font-medium ${
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
                  isOverloaded ? "bg-red-500" : "bg-primary"
                }`}
                style={{ width: `${Math.min(100, workloadPct)}%` }}
              />
            </div>

            {isOverloaded ? (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Plan is unrealistic.</p>
                  <p className="text-[11px] text-red-300/80">
                    Overloaded by {formatMinutes(plannedMin - availMin)}.
                  </p>
                  <button
                    onClick={() => onNavigateTab("planner")}
                    className="mt-1 text-[11px] font-semibold text-red-400 underline"
                  >
                    Open Daily Planner to Auto-Balance
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Workload is balanced within your {user?.preferences?.dailyWorkHours || 5.5}h capacity.
              </p>
            )}
          </div>

          {/* Attention Signals */}
          <div className="p-4 rounded-xl bg-card border border-border/80 space-y-2.5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Attention
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Deadlines this week</span>
                <span className="font-semibold text-foreground">{attentionData.deadlinesThisWeek}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Overdue tasks</span>
                <span
                  className={`font-semibold ${
                    attentionData.overdueCount > 0 ? "text-red-400" : "text-foreground"
                  }`}
                >
                  {attentionData.overdueCount}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Carried-over tasks</span>
                <span className="font-semibold text-amber-400">{attentionData.carriedOverCount}</span>
              </div>
            </div>
          </div>

          {/* Current Goal Progress */}
          {currentGoal && (
            <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  Active Goal
                </span>
                <span className="font-mono text-xs font-semibold text-primary">
                  {currentGoal.progress}%
                </span>
              </div>

              <h4 className="text-xs font-medium text-foreground leading-snug">
                {currentGoal.title}
              </h4>

              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${currentGoal.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* I'M OVERWHELMED Sanctuary Action Button */}
          <button
            type="button"
            onClick={onOpenOverwhelm}
            className="w-full py-3 rounded-xl bg-secondary/70 hover:bg-secondary border border-border/80 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            I'm Overwhelmed (Simplify UI)
          </button>
        </div>
      </div>
    </div>
  );
}
