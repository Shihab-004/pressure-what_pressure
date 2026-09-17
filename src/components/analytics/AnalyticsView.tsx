"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Brain,
  Trash2,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  Layers,
  Calendar,
} from "lucide-react";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { formatMinutes } from "@/lib/utils";
import { SpiderLogo } from "@/components/icons/SpiderLogo";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import { taskSync } from "@/lib/events/taskSync";

const CATEGORY_COLORS: Record<string, string> = {
  Rover: "#ef4444",       // Crimson
  University: "#3b82f6",  // Royal Blue
  Learning: "#10b981",    // Emerald
  Personal: "#f59e0b",    // Amber
  Career: "#a855f7",      // Purple
  Business: "#06b6d4",    // Cyan
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#38bdf8",
  low: "#94a3b8",
};

export function AnalyticsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const { apiFetch } = useApi();

  useEffect(() => {
    loadAnalytics();
    const unsub = taskSync.subscribe(() => {
      loadAnalytics(true);
    });
    return unsub;
  }, []);

  async function loadAnalytics(silent = false) {
    if (!silent) setLoading(true);
    const { data: analyticsData, error } = await apiFetch("/api/analytics");
    if (!silent) setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      setData(analyticsData);
    }
  }

  async function handleDismissForgottenTask(taskId: string, action: "reschedule" | "delete") {
    if (action === "delete") {
      await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      toast.info("Task removed");
      taskSync.notify({ type: "task:deleted", taskId });
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await apiFetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ scheduledDate: tomorrow.toISOString().split("T")[0] }),
      });
      toast.info("Task rescheduled to tomorrow");
      taskSync.notify({ type: "task:rescheduled", taskId });
    }
    loadAnalytics(true);
  }

  const weekly = data?.weekly || {
    planned: 0,
    completed: 0,
    cancelled: 0,
    carriedOver: 0,
    completionRate: 0,
    focusMinutes: 0,
  };

  const categories: Record<string, { total: number; completed: number; minutes: number }> =
    data?.categoryDistribution || {};
  const dailyVelocity: Array<{
    date: string;
    dayName: string;
    dayLabel: string;
    planned: number;
    completed: number;
    focusMinutes: number;
  }> = data?.dailyVelocity || [];

  const priorities = data?.priorityDistribution || {};
  const statuses = data?.statusDistribution || {};
  const estimation = data?.estimationIntelligence;
  const forgotten = data?.forgottenWork;
  const insights: string[] = data?.insights || [];

  // Calculations for Donut Chart
  const categoryEntries = useMemo(() => Object.entries(categories), [categories]);
  const totalCategoryTasks = useMemo(
    () => categoryEntries.reduce((acc, [, val]) => acc + val.total, 0),
    [categoryEntries]
  );

  // Generate SVG Pie/Donut Slices
  const pieSlices = useMemo(() => {
    if (totalCategoryTasks === 0) return [];
    let cumulativePercent = 0;

    return categoryEntries.map(([cat, stats]) => {
      const percent = (stats.total / totalCategoryTasks) * 100;
      const startAngle = (cumulativePercent / 100) * 360;
      cumulativePercent += percent;
      const endAngle = (cumulativePercent / 100) * 360;

      // SVG arc calculations (center 100, 100, radius 70, inner radius 45)
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const outerR = 70;
      const innerR = 45;

      const x1 = 100 + outerR * Math.cos(startRad);
      const y1 = 100 + outerR * Math.sin(startRad);
      const x2 = 100 + outerR * Math.cos(endRad);
      const y2 = 100 + outerR * Math.sin(endRad);

      const x3 = 100 + innerR * Math.cos(endRad);
      const y3 = 100 + innerR * Math.sin(endRad);
      const x4 = 100 + innerR * Math.cos(startRad);
      const y4 = 100 + innerR * Math.sin(startRad);

      const largeArc = percent > 50 ? 1 : 0;

      const pathData =
        categoryEntries.length === 1
          ? `M 100 ${100 - outerR} A ${outerR} ${outerR} 0 1 1 99.99 ${100 - outerR} M 100 ${100 - innerR} A ${innerR} ${innerR} 0 1 0 100.01 ${100 - innerR} Z`
          : `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

      return {
        category: cat,
        percent: Math.round(percent),
        count: stats.total,
        completed: stats.completed,
        color: CATEGORY_COLORS[cat] || "#64748b",
        pathData,
      };
    });
  }, [categoryEntries, totalCategoryTasks]);

  // Max value for Daily Velocity Bar Chart
  const maxDayTasks = useMemo(() => {
    let max = 1;
    dailyVelocity.forEach((d) => {
      if (d.planned > max) max = d.planned;
      if (d.completed > max) max = d.completed;
    });
    return Math.max(max, 4);
  }, [dailyVelocity]);

  // Priority Stacked Bar Total
  const totalPriorities =
    (priorities.critical?.total || 0) +
    (priorities.high?.total || 0) +
    (priorities.medium?.total || 0) +
    (priorities.low?.total || 0);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fadeIn">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-secondary/80 rounded animate-pulse" />
          <div className="h-8 w-64 bg-secondary/80 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-card/60 border border-border/60 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
          <SpiderLogo className="w-4 h-4 text-primary" />
          Evidence-Based Productive Analytics
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Performance, Accuracy & Historical Trends
        </h1>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="spider-card p-5 space-y-1">
          <span className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Completion Rate
          </span>
          <div className="text-3xl font-display font-extrabold tabular-nums text-foreground">
            {weekly.completionRate}%
          </div>
          <p className="text-[11px] text-muted-foreground font-display tabular-nums">
            {weekly.completed} of {weekly.planned} tasks finished
          </p>
        </div>

        <div className="spider-card p-5 space-y-1">
          <span className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            Focus Time Logged
          </span>
          <div className="text-3xl font-display font-extrabold tabular-nums text-primary">
            {formatMinutes(weekly.focusMinutes)}
          </div>
          <p className="text-[11px] text-muted-foreground font-display">Deep work logged</p>
        </div>

        <div className="spider-card p-5 space-y-1">
          <span className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Carried-Over
          </span>
          <div className="text-3xl font-display font-extrabold tabular-nums text-amber-400">
            {weekly.carriedOver}
          </div>
          <p className="text-[11px] text-muted-foreground font-display">Rescheduled items</p>
        </div>

        <div className="spider-card p-5 space-y-1">
          <span className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            Estimation Variance
          </span>
          <div
            className={`text-3xl font-display font-extrabold tabular-nums ${
              (estimation?.overallBiasPercentage || 0) > 15 ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {estimation?.overallBiasPercentage > 0 ? "+" : ""}
            {estimation?.overallBiasPercentage || 0}%
          </div>
          <p className="text-[11px] text-muted-foreground font-display">Planned vs actual drift</p>
        </div>
      </div>

      {/* Main Charts Row: Pie Chart + Daily Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Interactive Donut / Pie Chart: Category Distribution */}
        <div className="spider-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold text-foreground">Domain Workload Breakdown</h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-display tabular-nums">
              {totalCategoryTasks} Total Tasks
            </span>
          </div>

          {totalCategoryTasks === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-muted-foreground">
              No task distributions recorded yet.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
              {/* SVG Donut */}
              <div className="relative w-48 h-48 flex-shrink-0">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {pieSlices.map((slice) => {
                    const isHovered = hoveredCategory === slice.category;
                    return (
                      <path
                        key={slice.category}
                        d={slice.pathData}
                        fill={slice.color}
                        opacity={hoveredCategory && !isHovered ? 0.35 : 0.92}
                        className="transition-all duration-200 cursor-pointer hover:opacity-100 hover:scale-105 origin-center"
                        onMouseEnter={() => setHoveredCategory(slice.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    );
                  })}
                </svg>

                {/* Center Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-2xl font-extrabold font-display tabular-nums text-foreground">
                    {hoveredCategory
                      ? `${categories[hoveredCategory]?.total || 0}`
                      : `${totalCategoryTasks}`}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {hoveredCategory || "Total Tasks"}
                  </span>
                </div>
              </div>

              {/* Legend with Interactive Highlight */}
              <div className="space-y-2 flex-1 w-full text-xs">
                {pieSlices.map((slice) => {
                  const isHovered = hoveredCategory === slice.category;
                  return (
                    <div
                      key={slice.category}
                      onMouseEnter={() => setHoveredCategory(slice.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={`p-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        isHovered
                          ? "bg-secondary/80 shadow-2xs border border-primary/40"
                          : "hover:bg-secondary/40 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="font-semibold text-foreground">{slice.category}</span>
                      </div>
                      <div className="flex items-center gap-2 font-display tabular-nums text-[11px] text-muted-foreground">
                        <span>{slice.count} tasks</span>
                        <span className="px-1.5 py-0.5 rounded bg-secondary font-bold text-foreground">
                          {slice.percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Daily Velocity Bar Chart: Friday to Thursday Week Cycle */}
        <div className="spider-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold text-foreground">Weekly Velocity (Fri – Thu)</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-display">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-primary" /> Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-secondary-foreground/30" /> Planned
              </span>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
            {dailyVelocity.map((day) => {
              const plannedH = Math.round((day.planned / maxDayTasks) * 160);
              const completedH = Math.round((day.completed / maxDayTasks) * 160);
              const isToday = day.date === new Date().toISOString().split("T")[0];
              const isHovered = hoveredDay === day.date;

              return (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(day.date)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end cursor-pointer group"
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute bottom-28 z-20 px-2.5 py-1.5 bg-popover border border-border text-foreground text-[10px] rounded-lg shadow-lg font-display tabular-nums space-y-0.5 whitespace-nowrap">
                      <div className="font-bold">{day.dayName} · {day.dayLabel}</div>
                      <div>Completed: {day.completed}</div>
                      <div>Planned: {day.planned}</div>
                      {day.focusMinutes > 0 && <div>Focus: {formatMinutes(day.focusMinutes)}</div>}
                    </div>
                  )}

                  {/* Dual Bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-[170px] relative">
                    {/* Planned Bar */}
                    <div
                      style={{ height: `${Math.max(plannedH, 6)}px` }}
                      className="w-3.5 sm:w-5 rounded-t-md bg-secondary border border-border/80 transition-all group-hover:bg-secondary/80"
                      title={`Planned: ${day.planned}`}
                    />
                    {/* Completed Bar */}
                    <div
                      style={{ height: `${Math.max(completedH, day.completed > 0 ? 6 : 2)}px` }}
                      className={`w-3.5 sm:w-5 rounded-t-md transition-all ${
                        day.completed > 0
                          ? "bg-gradient-to-t from-primary to-rose-500 shadow-glow-crimson-sm"
                          : "bg-transparent"
                      }`}
                      title={`Completed: ${day.completed}`}
                    />
                  </div>

                  {/* Day Label (Friday, Saturday...) */}
                  <div className="text-center pt-1 border-t border-border/60 w-full">
                    <span
                      className={`block font-display text-[11px] font-bold uppercase tracking-wider ${
                        isToday ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span className="block text-[9px] text-muted-foreground font-display tabular-nums">
                      {day.dayLabel.split(" ")[1]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Priority Distribution Stacked Bar & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Stacked Bar */}
        <div className="spider-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-foreground">Priority Breakdown</h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-display tabular-nums">
              {totalPriorities} Classified Tasks
            </span>
          </div>

          {/* Segmented Stacked Bar */}
          <div className="w-full h-4 rounded-full bg-secondary overflow-hidden flex shadow-inner">
            {Object.entries(priorities).map(([pKey, pStats]: [string, any]) => {
              if (totalPriorities === 0) return null;
              const pct = (pStats.total / totalPriorities) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={pKey}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: PRIORITY_COLORS[pKey],
                  }}
                  className="h-full transition-all hover:opacity-90 cursor-pointer"
                  title={`${pKey.toUpperCase()}: ${pStats.total} tasks (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>

          {/* Priority Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            {Object.entries(priorities).map(([pKey, pStats]: [string, any]) => (
              <div
                key={pKey}
                className="p-2.5 rounded-xl bg-secondary/40 border border-border/70 space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[pKey] }}
                  />
                  <span className="font-semibold capitalize text-foreground text-[11px]">{pKey}</span>
                </div>
                <div className="font-display font-extrabold text-sm tabular-nums text-foreground">
                  {pStats.total}
                </div>
                <div className="text-[10px] text-muted-foreground font-display tabular-nums">
                  {pStats.completed} completed
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution Grid */}
        <div className="spider-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold text-foreground">Workspace State Matrix</h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-display">Current Lifecycle</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/80 flex items-center justify-between">
              <div>
                <span className="text-muted-foreground block text-[11px] font-medium">Completed</span>
                <span className="font-display font-bold text-lg text-emerald-400 tabular-nums">
                  {statuses.completed || 0}
                </span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-70" />
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/80 flex items-center justify-between">
              <div>
                <span className="text-muted-foreground block text-[11px] font-medium">Scheduled</span>
                <span className="font-display font-bold text-lg text-sky-400 tabular-nums">
                  {statuses.planned || 0}
                </span>
              </div>
              <Calendar className="w-5 h-5 text-sky-400 opacity-70" />
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/80 flex items-center justify-between">
              <div>
                <span className="text-muted-foreground block text-[11px] font-medium">Inbox (Unassigned)</span>
                <span className="font-display font-bold text-lg text-foreground tabular-nums">
                  {statuses.inbox || 0}
                </span>
              </div>
              <Target className="w-5 h-5 text-muted-foreground opacity-70" />
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/80 flex items-center justify-between">
              <div>
                <span className="text-muted-foreground block text-[11px] font-medium">Overdue Targets</span>
                <span className="font-display font-bold text-lg text-red-400 tabular-nums">
                  {statuses.overdue || 0}
                </span>
              </div>
              <AlertTriangle className="w-5 h-5 text-red-400 opacity-70" />
            </div>
          </div>
        </div>
      </div>

      {/* Estimation Intelligence (Planned vs Actual Divergence) */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-specular-card space-y-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Estimation Divergence Intelligence</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compares initial time estimates against recorded deep-work focus sessions to diagnose duration accuracy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/80 space-y-2">
            <span className="font-semibold text-foreground">Short Tasks (&lt; 30m)</span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-muted-foreground">Variance:</span>
              <span className="font-display font-bold tabular-nums text-foreground">
                {estimation?.under30Min?.averageDiffPercentage > 0 ? "+" : ""}
                {estimation?.under30Min?.averageDiffPercentage || 0}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-display tabular-nums">
              Sample: {estimation?.under30Min?.count || 0} tasks
            </p>
          </div>

          <div className="p-4 rounded-xl bg-secondary/40 border border-border/80 space-y-2">
            <span className="font-semibold text-foreground">Medium Tasks (30–60m)</span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-muted-foreground">Variance:</span>
              <span className="font-display font-bold tabular-nums text-foreground">
                {estimation?.between30And60Min?.averageDiffPercentage > 0 ? "+" : ""}
                {estimation?.between30And60Min?.averageDiffPercentage || 0}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-display tabular-nums">
              Sample: {estimation?.between30And60Min?.count || 0} tasks
            </p>
          </div>

          <div className="p-4 rounded-xl bg-secondary/40 border border-border/80 space-y-2">
            <span className="font-semibold text-foreground">Deep Work Tasks (&gt; 60m)</span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-muted-foreground">Variance:</span>
              <span className="font-display font-bold tabular-nums text-foreground">
                {estimation?.over60Min?.averageDiffPercentage > 0 ? "+" : ""}
                {estimation?.over60Min?.averageDiffPercentage || 0}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-display tabular-nums">
              Sample: {estimation?.over60Min?.count || 0} tasks
            </p>
          </div>
        </div>
      </div>

      {/* Evidence-Based Factual Observations */}
      {insights.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-primary/5 border border-primary/25 space-y-3 shadow-specular-card">
          <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Empirical Planning Insights
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-foreground/90">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-card/70 border border-border/80 flex items-start gap-2.5"
              >
                <span className="text-primary font-bold">•</span>
                <span className="leading-relaxed">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forgotten Work Detector */}
      {forgotten && forgotten.count > 0 && (
        <div className="p-6 rounded-2xl bg-card border border-amber-500/40 shadow-specular-card space-y-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Forgotten Work Detector ({forgotten.count} items)
              </h3>
              <p className="text-xs text-muted-foreground">
                Items inactive for more than 14 days. Re-engage or prune them to reduce cognitive debt.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {forgotten.tasks.map((task: any) => (
              <div
                key={task._id}
                className="p-3.5 rounded-xl bg-secondary/40 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-card text-muted-foreground border border-border/60 mr-2">
                    {task.category}
                  </span>
                  <span className="font-semibold text-foreground">{task.title}</span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleDismissForgottenTask(task._id, "reschedule")}
                    className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/80 text-foreground text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismissForgottenTask(task._id, "delete")}
                    className="p-2 text-muted-foreground hover:text-red-400 rounded-xl hover:bg-secondary transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
