"use client";

import React from "react";
import { ShieldCheck, ArrowLeft, Play, CheckCircle2, Clock, Calendar } from "lucide-react";
import { ITask } from "@/types";
import { formatMinutes, formatDateLabel } from "@/lib/utils";

interface OverwhelmModeProps {
  allPendingCount: number;
  criticalTasks: ITask[];
  onExit: () => void;
  onStartFocus: (task: ITask) => void;
  onCompleteTask: (taskId: string) => void;
}

export function OverwhelmMode({
  allPendingCount,
  criticalTasks,
  onExit,
  onStartFocus,
  onCompleteTask,
}: OverwhelmModeProps) {
  // Take top 3 or 4 actionable tasks only
  const visibleTasks = criticalTasks.slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 sm:p-12 animate-fadeIn">
      <div className="w-full max-w-2xl space-y-8 text-left">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
              <ShieldCheck className="w-4 h-4" />
              Sanctuary Mode Active
            </div>

            <button
              onClick={onExit}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit Overwhelm Mode
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Breathe. You only need to do one thing next.
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            You currently have <span className="font-semibold text-foreground">{allPendingCount}</span> pending tasks.
            Everything non-urgent has been temporarily hidden to protect your focus. For now, look only at these:
          </p>
        </div>

        {/* Focused Tasks List */}
        <div className="space-y-3">
          {visibleTasks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-medium text-foreground">All immediate critical items are clear.</p>
              <p className="text-xs text-muted-foreground">Take a well-deserved rest.</p>
            </div>
          ) : (
            visibleTasks.map((task, index) => (
              <div
                key={task._id}
                className="p-5 rounded-2xl bg-card/80 border border-border/80 hover:border-primary/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-foreground text-xs font-bold flex items-center justify-center border border-border mt-0.5">
                    {index + 1}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary px-2 py-0.5 rounded bg-primary/10">
                        {task.category}
                      </span>
                      {task.deadline && (
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateLabel(task.deadline)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-medium text-foreground">{task.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center self-end">
                  <button
                    type="button"
                    onClick={() => onStartFocus(task)}
                    className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Focus ({formatMinutes(task.estimatedMinutes || 45)})
                  </button>
                  <button
                    type="button"
                    onClick={() => onCompleteTask(task._id)}
                    className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Done
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span>{Math.max(0, allPendingCount - visibleTasks.length)} tasks safely stored out of sight.</span>
          <button
            onClick={onExit}
            className="text-xs font-medium text-primary hover:underline"
          >
            Show full workspace
          </button>
        </div>
      </div>
    </div>
  );
}
