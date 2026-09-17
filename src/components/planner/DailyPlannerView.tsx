"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle,
  Plus,
  ArrowLeft,
  ArrowRight,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { ITask } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { formatMinutes, formatDateLabel } from "@/lib/utils";
import { addDays, subDays, format } from "date-fns";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

interface DailyPlannerViewProps {
  onStartFocus: (task: ITask) => void;
  onReschedule: (task: ITask) => void;
  onOpenNewTask: () => void;
}

export function DailyPlannerView({
  onStartFocus,
  onReschedule,
  onOpenNewTask,
}: DailyPlannerViewProps) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(true);
  const [balancing, setBalancing] = useState(false);
  const [planData, setPlanData] = useState<any>(null);

  const { apiFetch } = useApi();

  useEffect(() => {
    loadDailyPlan();
  }, [selectedDate]);

  async function loadDailyPlan() {
    setLoading(true);
    const { data, error } = await apiFetch(`/api/planner/daily?date=${selectedDate}`);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      setPlanData(data);
    }
  }

  async function handleAutoBalance() {
    setBalancing(true);
    const { data, error } = await apiFetch("/api/planner/auto-balance", {
      method: "POST",
      body: JSON.stringify({ date: selectedDate }),
    });
    setBalancing(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(data.message || "Workload balanced successfully!");
      loadDailyPlan();
    }
  }

  async function handleToggleComplete(task: ITask) {
    const isComp = task.status === "completed";
    const nextStatus = isComp ? "planned" : "completed";
    await apiFetch(`/api/tasks/${task._id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    loadDailyPlan();
  }

  const workload = planData?.workload;
  const isOverloaded = workload?.isOverloaded || false;
  const plannedMin = workload?.totalPlannedMinutes || 0;
  const availMin = workload?.availableMinutes || 330;
  const tasks: any[] = planData?.tasks || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Date Bar & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
            <SpiderLogo className="w-4 h-4 text-primary" />
            Daily Execution Timeline
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {format(new Date(`${selectedDate}T00:00:00`), "EEEE, MMMM d, yyyy")}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd"))}
            className="p-2 rounded-xl bg-secondary/70 hover:bg-secondary text-foreground transition-colors border border-border/70"
            title="Previous Day"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
            className="px-3.5 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-semibold transition-colors border border-border/70"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), "yyyy-MM-dd"))}
            className="p-2 rounded-xl bg-secondary/70 hover:bg-secondary text-foreground transition-colors border border-border/70"
            title="Next Day"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workload Capacity & Auto-Balance Banner */}
      <div className="spider-card p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground">
              Capacity Breakdown
            </span>
          </div>
          <span
            className={`font-display tabular-nums text-xs font-bold ${
              isOverloaded ? "text-red-400" : "text-emerald-400"
            }`}
          >
            Planned: {formatMinutes(plannedMin)} / Available: {formatMinutes(availMin)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isOverloaded
                ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-glow-crimson-sm"
                : "bg-gradient-to-r from-primary to-rose-500"
            }`}
            style={{ width: `${Math.min(100, Math.round((plannedMin / availMin) * 100))}%` }}
          />
        </div>

        {/* Overload Alert & 1-Click Auto-Balance Action */}
        {isOverloaded && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-display font-bold text-red-300">
                  Day exceeds realistic capacity.
                </span>{" "}
                <span className="text-red-300/80 font-display tabular-nums">
                  Over budget by {formatMinutes(plannedMin - availMin)}. Flexible tasks can be automatically shifted.
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={balancing}
              onClick={handleAutoBalance}
              className="spider-btn-primary spider-btn-sm whitespace-nowrap self-end sm:self-center"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>AUTO-BALANCE DAY</span>
            </button>
          </div>
        )}
      </div>

      {/* Timeline Schedule */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Scheduled Timeline ({tasks.length} tasks)
          </h2>
          <button
            type="button"
            onClick={onOpenNewTask}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Add to plan
          </button>
        </div>

        {loading ? (
          <div className="py-14 text-center text-xs text-muted-foreground">
            Synchronizing schedule...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-10 rounded-2xl bg-card border border-border text-center space-y-2 shadow-specular-card">
            <CheckCircle2 className="w-9 h-9 text-muted-foreground/60 mx-auto" />
            <p className="text-sm font-semibold text-foreground">No tasks scheduled for this day.</p>
            <p className="text-xs text-muted-foreground">
              Add tasks from your Inbox or use the Weekly Planner to allocate items.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isCompleted = task.status === "completed";
              return (
                <div
                  key={task._id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted
                      ? "bg-card/40 border-border/40 opacity-60"
                      : "bg-card border-border/80 hover:border-primary/40 shadow-specular-card"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        isCompleted
                          ? "bg-emerald-500 border-emerald-500 text-white animate-web-snap"
                          : "border-border/80 hover:border-primary text-transparent bg-secondary/40"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5 fill-current" />
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display tabular-nums text-xs text-primary font-bold">
                          {task.timeSlot}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground border border-border/70">
                          {task.category}
                        </span>
                      </div>
                      <h3
                        className={`text-sm font-semibold leading-snug ${
                          isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => onStartFocus(task)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-glow-crimson-sm border border-red-400/30 active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Focus
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onReschedule(task)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      title="Reschedule"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
