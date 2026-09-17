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
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Weekly Architecture
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {weekData ? `${weekData.weekStart} – ${weekData.weekEnd}` : "Weekly Planner"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentWeekBase((prev) => subWeeks(prev, 1))}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWeekBase(new Date())}
              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium"
            >
              Current Week
            </button>
            <button
              onClick={() => setCurrentWeekBase((prev) => addWeeks(prev, 1))}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={building}
            onClick={handleBuildMyWeek}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
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
        <div className="py-20 text-center text-xs text-muted-foreground">Loading week plan...</div>
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
                className={`flex flex-col rounded-xl border p-3 min-h-[320px] transition-colors ${
                  isToday
                    ? "bg-card border-primary/50 shadow-sm"
                    : "bg-card/50 border-border/70"
                }`}
              >
                {/* Column Header */}
                <div className="border-b border-border pb-2 mb-2 flex items-center justify-between">
                  <div>
                    <div
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isToday ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {dayName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{dayNum}</div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-[10px] text-muted-foreground font-medium">
                      {formatMinutes(totalMin)}
                    </span>
                  </div>
                </div>

                {/* Task Cards for Day */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[420px] pr-0.5">
                  {dayTasks.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-[11px] text-muted-foreground/60 border border-dashed border-border/50 rounded-lg">
                      Clear
                    </div>
                  ) : (
                    dayTasks.map((task: any) => {
                      const isCompleted = task.status === "completed";
                      return (
                        <div
                          key={task._id}
                          className={`p-2 rounded-lg border text-xs space-y-1 transition-all ${
                            isCompleted
                              ? "bg-secondary/30 border-border/40 opacity-60 line-through text-muted-foreground"
                              : "bg-secondary/70 border-border/80 text-foreground hover:border-primary/40 shadow-xs"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-semibold uppercase px-1 py-0.2 rounded bg-card text-muted-foreground">
                              {task.category}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {task.estimatedMinutes || 45}m
                            </span>
                          </div>
                          <p className="font-medium line-clamp-2 leading-tight">{task.title}</p>
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
