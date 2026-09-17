"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Sparkles,
  Plus,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { ITask } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { formatMinutes } from "@/lib/utils";
import { addWeeks, subWeeks, format } from "date-fns";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

interface WeeklyPlannerViewProps {
  onStartFocus: (task: ITask) => void;
  onOpenNewTask: () => void;
}

export function WeeklyPlannerView({ onStartFocus, onOpenNewTask }: WeeklyPlannerViewProps) {
  const [currentWeekBase, setCurrentWeekBase] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [weekData, setWeekData] = useState<any>(null);

  const { apiFetch } = useApi();

  useEffect(() => {
    loadWeekData();
  }, [currentWeekBase]);

  async function loadWeekData() {
    setLoading(true);
    const dateStr = format(currentWeekBase, "yyyy-MM-dd");
    const { data, error } = await apiFetch(`/api/planner/weekly?date=${dateStr}`);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      setWeekData(data);
    }
  }

  async function handleBuildMyWeek() {
    setBuilding(true);
    const { data, error } = await apiFetch("/api/planner/weekly", {
      method: "POST",
      body: JSON.stringify({ weekStart: weekData?.weekStart }),
    });
    setBuilding(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(data.message || "Week populated realistically!");
      loadWeekData();
    }
  }

  const days: Record<string, any[]> = weekData?.days || {};
  const dayKeys = Object.keys(days).sort();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
            <SpiderLogo className="w-4 h-4 text-primary" />
            Weekly Architecture
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {weekData ? `${weekData.weekStart} – ${weekData.weekEnd}` : "Weekly Planner"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary/40 border border-border/80 p-1 rounded-xl">
            <button
              onClick={() => setCurrentWeekBase((prev) => subWeeks(prev, 1))}
              className="p-1.5 rounded-lg hover:bg-secondary text-foreground transition-colors"
              title="Previous Week"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWeekBase(new Date())}
              className="px-3 py-1 rounded-lg hover:bg-secondary text-foreground text-xs font-semibold"
            >
              Current
            </button>
            <button
              onClick={() => setCurrentWeekBase((prev) => addWeeks(prev, 1))}
              className="p-1.5 rounded-lg hover:bg-secondary text-foreground transition-colors"
              title="Next Week"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={building}
            onClick={handleBuildMyWeek}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-glow-crimson-sm border border-red-400/30 transition-all whitespace-nowrap active:scale-95"
          >
            {building ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            BUILD MY WEEK
          </button>
        </div>
      </div>

      {/* 7-Day Grid */}
      {loading ? (
        <div className="py-24 text-center text-xs text-muted-foreground">Synchronizing weekly architecture...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {dayKeys.map((dateStr) => {
            const dayDate = new Date(`${dateStr}T00:00:00`);
            const dayName = format(dayDate, "EEE");
            const dayNum = format(dayDate, "MMM d");
            const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
            const dayTasks = days[dateStr] || [];

            const totalMin = dayTasks.reduce(
              (acc, t) => acc + (t.estimatedMinutes || 45),
              0
            );

            return (
              <div
                key={dateStr}
                className={`flex flex-col rounded-xl border p-3 min-h-[340px] transition-all ${
                  isToday
                    ? "spider-card border-primary/50 shadow-glow-crimson-sm"
                    : "spider-card hover:border-border"
                }`}
              >
                {/* Column Header */}
                <div className="border-b border-border/80 pb-2 mb-2 flex items-center justify-between">
                  <div>
                    <div
                      className={`text-xs font-display font-bold uppercase tracking-wider ${
                        isToday ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {dayName}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-display tabular-nums">{dayNum}</div>
                  </div>

                  <div className="text-right">
                    <span className="font-display tabular-nums text-[10px] text-muted-foreground font-semibold px-1.5 py-0.5 rounded bg-secondary">
                      {formatMinutes(totalMin)}
                    </span>
                  </div>
                </div>

                {/* Task Cards for Day */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[420px] pr-0.5">
                  {dayTasks.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-[11px] text-muted-foreground/60 border border-dashed border-border/60 rounded-xl font-display">
                      Clear
                    </div>
                  ) : (
                    dayTasks.map((task: any) => {
                      const isCompleted = task.status === "completed";
                      return (
                        <div
                          key={task._id}
                          className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition-all ${
                            isCompleted
                              ? "bg-secondary/30 border-border/40 opacity-60 line-through text-muted-foreground"
                              : "bg-secondary/60 border-border/80 text-foreground hover:border-primary/40 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-display font-bold uppercase px-1.5 py-0.5 rounded bg-card text-muted-foreground border border-border/60">
                              {task.category}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-display tabular-nums">
                              {task.estimatedMinutes || 45}m
                            </span>
                          </div>
                          <p className="font-semibold line-clamp-2 leading-snug">{task.title}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
