"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Brain,
  Trash2,
  RotateCcw,
  Sparkles,
  Layers,
} from "lucide-react";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { formatMinutes } from "@/lib/utils";

export function AnalyticsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { apiFetch } = useApi();

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    const { data: analyticsData, error } = await apiFetch("/api/analytics");
    setLoading(false);

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
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await apiFetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ scheduledDate: tomorrow.toISOString().split("T")[0] }),
      });
      toast.info("Task rescheduled to tomorrow");
    }
    loadAnalytics();
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-muted-foreground">
        Aggregating factual analytics and patterns...
      </div>
    );
  }

  const weekly = data?.weekly || {
    planned: 0,
    completed: 0,
    cancelled: 0,
    carriedOver: 0,
    completionRate: 0,
    focusMinutes: 0,
  };

  const categories: Record<string, { total: number; completed: number }> =
    data?.categoryDistribution || {};
  const estimation = data?.estimationIntelligence;
  const forgotten = data?.forgottenWork;
  const insights: string[] = data?.insights || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-primary" />
          Evidence-Based Productive Analytics
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Performance, Accuracy & Historical Trends
        </h1>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Weekly Completion
          </span>
          <div className="text-3xl font-mono font-bold text-foreground">
            {weekly.completionRate}%
          </div>
          <p className="text-[11px] text-muted-foreground">
            {weekly.completed} of {weekly.planned} planned tasks
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Focus Time Logged
          </span>
          <div className="text-3xl font-mono font-bold text-primary">
            {formatMinutes(weekly.focusMinutes)}
          </div>
          <p className="text-[11px] text-muted-foreground">Recorded in deep work sessions</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Carried-Over Tasks
          </span>
          <div className="text-3xl font-mono font-bold text-amber-400">{weekly.carriedOver}</div>
          <p className="text-[11px] text-muted-foreground">Rescheduled across days</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Estimation Bias
          </span>
          <div
            className={`text-3xl font-mono font-bold ${
              (estimation?.overallBiasPercentage || 0) > 15
                ? "text-red-400"
                : "text-emerald-400"
            }`}
          >
            {estimation?.overallBiasPercentage > 0 ? "+" : ""}
            {estimation?.overallBiasPercentage || 0}%
          </div>
          <p className="text-[11px] text-muted-foreground">Average difference from estimate</p>
        </div>
      </div>

      {/* Evidence-Based Insight Engine */}
      {insights.length > 0 && (
        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Empirical Planning Observations
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-foreground/90">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-card/60 border border-border flex items-start gap-2.5">
                <span className="text-primary font-bold">•</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estimation Intelligence Table: Planned vs Actual */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Estimation Intelligence</h3>
            <p className="text-xs text-muted-foreground">
              Analyzes historical tasks to pinpoint where duration estimates diverge.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Under 30 min */}
          <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
            <span className="font-semibold text-foreground">Short Tasks (&lt; 30 min)</span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-muted-foreground">Variance:</span>
              <span className="font-mono font-bold text-foreground">
                {estimation?.under30Min?.averageDiffPercentage > 0 ? "+" : ""}
                {estimation?.under30Min?.averageDiffPercentage || 0}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Sample: {estimation?.under30Min?.count || 0} completed
            </p>
          </div>

          {/* 30 - 60 min */}
          <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
            <span className="font-semibold text-foreground">Medium Tasks (30–60 min)</span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-muted-foreground">Variance:</span>
              <span className="font-mono font-bold text-foreground">
                {estimation?.between30And60Min?.averageDiffPercentage > 0 ? "+" : ""}
                {estimation?.between30And60Min?.averageDiffPercentage || 0}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Sample: {estimation?.between30And60Min?.count || 0} completed
            </p>
          </div>

          {/* Over 60 min */}
          <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
            <span className="font-semibold text-foreground">Deep Work Tasks (&gt; 60 min)</span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-muted-foreground">Variance:</span>
              <span className="font-mono font-bold text-foreground">
                {estimation?.over60Min?.averageDiffPercentage > 0 ? "+" : ""}
                {estimation?.over60Min?.averageDiffPercentage || 0}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Sample: {estimation?.over60Min?.count || 0} completed
            </p>
          </div>
        </div>
      </div>

      {/* Work by Category */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-foreground">Workload Distribution by Domain</h3>

        <div className="space-y-3">
          {Object.entries(categories).map(([catName, stats]) => {
            const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            return (
              <div key={catName} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{catName}</span>
                  <span className="text-muted-foreground">
                    {stats.completed} / {stats.total} completed ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forgotten Work Detector */}
      {forgotten && forgotten.count > 0 && (
        <div className="p-6 rounded-2xl bg-card border border-amber-500/40 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-semibold text-foreground">
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
                className="p-3 rounded-xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="px-1.5 py-0.2 rounded bg-card text-[10px] text-muted-foreground mr-2">
                    {task.category}
                  </span>
                  <span className="font-medium text-foreground">{task.title}</span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleDismissForgottenTask(task._id, "reschedule")}
                    className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground text-[11px] font-medium flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismissForgottenTask(task._id, "delete")}
                    className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
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
