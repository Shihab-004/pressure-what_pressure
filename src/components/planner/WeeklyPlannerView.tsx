"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Sparkles,
  Plus,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { ITask } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { formatMinutes } from "@/lib/utils";
import { addWeeks, subWeeks, addDays, format, startOfWeek } from "date-fns";
import { SpiderLogo } from "@/components/icons/SpiderLogo";
import { taskSync } from "@/lib/events/taskSync";
import { ColumnSkeleton } from "@/components/ui/Skeleton";

interface WeeklyPlannerViewProps {
  onStartFocus: (task: ITask) => void;
  onOpenNewTask: (defaultDate?: string) => void;
  onEditTask?: (task: ITask) => void;
}

export function WeeklyPlannerView({
  onStartFocus,
  onOpenNewTask,
  onEditTask,
}: WeeklyPlannerViewProps) {
  const [currentWeekBase, setCurrentWeekBase] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [weekData, setWeekData] = useState<any>(null);

  const { apiFetch } = useApi();

  useEffect(() => {
    loadWeekData();
    const unsubscribe = taskSync.subscribe(() => {
      loadWeekData(true);
    });
    return unsubscribe;
  }, [currentWeekBase]);

  async function loadWeekData(silent = false) {
    if (!silent) setLoading(true);
    const dateStr = format(currentWeekBase, "yyyy-MM-dd");
    const { data, error } = await apiFetch(`/api/planner/weekly?date=${dateStr}`);
    if (!silent) setLoading(false);

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
      taskSync.notify({ type: "workspace:refresh" });
      loadWeekData(true);
    }
  }

  async function handleToggleComplete(task: any) {
    const isComp = task.status === "completed";
    const nextStatus = isComp ? "planned" : "completed";

    // Optimistic local update
    setWeekData((prev: any) => {
      if (!prev?.days) return prev;
      const updatedDays: Record<string, any[]> = {};
      Object.keys(prev.days).forEach((dateKey) => {
        updatedDays[dateKey] = prev.days[dateKey].map((t: any) =>
          t._id === task._id ? { ...t, status: nextStatus } : t
        );
      });
      return { ...prev, days: updatedDays };
    });

    const { error } = await apiFetch(`/api/tasks/${task._id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });

    if (error) {
      toast.error(error);
      loadWeekData(true);
    } else {
      taskSync.notify({ type: "task:completed", taskId: task._id });
    }
  }

  async function handleShiftTaskDate(task: any, currentDayStr: string, direction: "prev" | "next") {
    const currentDate = new Date(`${currentDayStr}T00:00:00`);
    const targetDate = format(addDays(currentDate, direction === "next" ? 1 : -1), "yyyy-MM-dd");

    // Optimistic update
    setWeekData((prev: any) => {
      if (!prev?.days) return prev;
      const updatedDays: Record<string, any[]> = { ...prev.days };
      // Remove from current day
      if (updatedDays[currentDayStr]) {
        updatedDays[currentDayStr] = updatedDays[currentDayStr].filter((t: any) => t._id !== task._id);
      }
      // Add to target day if in view
      if (updatedDays[targetDate]) {
        updatedDays[targetDate] = [...updatedDays[targetDate], { ...task, scheduledDate: targetDate }];
      }
      return { ...prev, days: updatedDays };
    });

    const { error } = await apiFetch(`/api/tasks/${task._id}`, {
      method: "PATCH",
      body: JSON.stringify({ scheduledDate: targetDate, status: "planned" }),
    });

    if (error) {
      toast.error(error);
      loadWeekData(true);
    } else {
      toast.success(`Moved to ${targetDate}`);
      taskSync.notify({ type: "task:rescheduled", taskId: task._id });
    }
  }

  const days: Record<string, any[]> = weekData?.days || {};

  // STRICT Sequence: Friday -> Saturday -> Sunday -> Monday -> Tuesday -> Wednesday -> Thursday
  const dayKeys: string[] = [];
  if (weekData?.weekStart) {
    const start = new Date(`${weekData.weekStart}T00:00:00`);
    for (let i = 0; i < 7; i++) {
      dayKeys.push(format(addDays(start, i), "yyyy-MM-dd"));
    }
  } else {
    const start = startOfWeek(currentWeekBase, { weekStartsOn: 5 });
    for (let i = 0; i < 7; i++) {
      dayKeys.push(format(addDays(start, i), "yyyy-MM-dd"));
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
            <SpiderLogo className="w-4 h-4 text-primary" />
            Weekly Architecture (Fri – Thu)
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
              Current Week
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

      {/* 7-Day Grid: Strictly Fri -> Sat -> Sun -> Mon -> Tue -> Wed -> Thu */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
            <ColumnSkeleton key={idx} />
          ))}
        </div>
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
                className={`flex flex-col rounded-xl border p-3 min-h-[350px] transition-all group/col ${
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
                        isToday ? "text-primary flex items-center gap-1" : "text-foreground"
                      }`}
                    >
                      <span>{dayName}</span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-ping" />
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-display tabular-nums">
                      {dayNum}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-display tabular-nums text-[10px] text-muted-foreground font-semibold px-1.5 py-0.5 rounded bg-secondary">
                      {formatMinutes(totalMin)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenNewTask(dateStr)}
                      className="p-1 rounded-md hover:bg-primary/20 hover:text-primary text-muted-foreground transition-colors"
                      title={`Add task for ${dayName} (${dayNum})`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Task Cards for Day */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[440px] pr-0.5">
                  {dayTasks.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => onOpenNewTask(dateStr)}
                      className="w-full h-24 flex flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground/60 hover:text-primary border border-dashed border-border/60 hover:border-primary/40 rounded-xl font-display transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Empty · Add</span>
                    </button>
                  ) : (
                    dayTasks.map((task: any) => {
                      const isCompleted = task.status === "completed";
                      return (
                        <div
                          key={task._id}
                          className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition-all group/item ${
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

                          <div className="flex items-start gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleComplete(task)}
                              className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                                isCompleted
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-border/80 hover:border-primary text-transparent"
                              }`}
                              title={isCompleted ? "Mark incomplete" : "Complete task"}
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 fill-current" />
                            </button>
                            <p
                              onClick={() => onEditTask?.(task)}
                              className="font-semibold line-clamp-2 leading-snug cursor-pointer hover:text-primary transition-colors flex-1"
                            >
                              {task.title}
                            </p>
                          </div>

                          {/* Quick Shift Controls & Focus */}
                          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleShiftTaskDate(task, dateStr, "prev")}
                                className="p-0.5 hover:text-foreground rounded hover:bg-secondary"
                                title="Move 1 day back"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleShiftTaskDate(task, dateStr, "next")}
                                className="p-0.5 hover:text-foreground rounded hover:bg-secondary"
                                title="Move 1 day forward"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>

                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => onStartFocus(task)}
                                className="text-[10px] text-primary font-bold hover:underline"
                              >
                                Focus
                              </button>
                            )}
                          </div>
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
