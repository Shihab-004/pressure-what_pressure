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
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Daily Execution Planner
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {format(new Date(`${selectedDate}T00:00:00`), "EEEE, MMMM d, yyyy")}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd"))}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), "yyyy-MM-dd"))}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workload Capacity & Auto-Balance Banner */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Day Capacity Analysis
            </span>
          </div>
          <span
            className={`font-mono text-xs font-bold ${
              isOverloaded ? "text-red-400" : "text-emerald-400"
            }`}
          >
            Planned: {formatMinutes(plannedMin)} / Available: {formatMinutes(availMin)}
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isOverloaded ? "bg-red-500" : "bg-primary"
            }`}
            style={{ width: `${Math.min(100, Math.round((plannedMin / availMin) * 100))}%` }}
          />
        </div>

        {/* Overload Alert & 1-Click Auto-Balance Action */}
        {isOverloaded && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-red-300">
                  Your current plan is unrealistic.
                </span>{" "}
                <span className="text-red-300/80">
                  You are over budget by {formatMinutes(plannedMin - availMin)}. Flexible work can be
                  redistributed.
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={balancing}
              onClick={handleAutoBalance}
              className="px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap self-end sm:self-center"
            >
              <Sliders className="w-3.5 h-3.5" />
              AUTO-BALANCE MY DAY
            </button>
          </div>
        )}
      </div>

      {/* Timeline Schedule */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Scheduled Timeline ({tasks.length} tasks)
          </h2>
          <button
            type="button"
            onClick={onOpenNewTask}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add to plan
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Loading schedule...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-foreground">No tasks scheduled for this day.</p>
            <p className="text-xs text-muted-foreground">
              Add tasks from Inbox or use the Weekly Planner to assign items.
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
                      ? "bg-card/40 border-border/40 opacity-70"
                      : "bg-card border-border/80 hover:border-primary/50 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isCompleted
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-border hover:border-primary text-transparent"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5 fill-current" />
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-primary font-semibold">
                          {task.timeSlot}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-secondary text-muted-foreground">
                          {task.category}
                        </span>
                      </div>
                      <h3
                        className={`text-sm font-medium leading-snug ${
                          isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => onStartFocus(task)}
                        className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Focus
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onReschedule(task)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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
