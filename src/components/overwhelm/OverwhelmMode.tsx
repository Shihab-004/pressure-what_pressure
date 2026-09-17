"use client";

import React from "react";
import { ShieldCheck, ArrowLeft, Play, CheckCircle2, Clock, Calendar } from "lucide-react";
import { ITask } from "@/types";
import { formatMinutes, formatDateLabel } from "@/lib/utils";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

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
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 sm:p-12 animate-fadeIn web-pattern-bg">
      <div className="w-full max-w-2xl space-y-8 text-left">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-display font-semibold shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Sanctuary Protocol Active</span>
            </div>

            <button
              onClick={onExit}
              className="spider-btn-secondary spider-btn-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Resume OS</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-foreground leading-tight">
            Isolate the signal. Focus on one action.
          </h1>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Non-urgent items sequestered ({allPendingCount} queued). Peripheral distractions muted.
          </p>
        </div>

        {/* Focused Tasks List */}
        <div className="space-y-3">
          {visibleTasks.length === 0 ? (
            <div className="spider-card p-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-base font-display font-bold text-foreground">Critical path clear.</p>
              <p className="text-xs text-muted-foreground">All priority items complete.</p>
            </div>
          ) : (
            visibleTasks.map((task, index) => (
              <div
                key={task._id}
                className="spider-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/20 text-primary text-xs font-display font-bold flex items-center justify-center border border-primary/30 mt-0.5 shadow-glow-crimson-sm">
                    {index + 1}
                  </span>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-display font-semibold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20 uppercase tracking-wider">
                        {task.category}
                      </span>
                      {task.deadline && (
                        <span className="text-xs text-amber-400 font-display font-medium tabular-nums flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateLabel(task.deadline)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-foreground leading-snug break-words">
                      {task.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto sm:self-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onStartFocus(task)}
                    className="spider-btn-primary spider-btn-sm flex-1 sm:flex-initial justify-center"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Focus ({formatMinutes(task.estimatedMinutes || 45)})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCompleteTask(task._id)}
                    className="spider-btn-secondary spider-btn-sm flex-1 sm:flex-initial justify-center text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground font-display">
          <span>{Math.max(0, allPendingCount - visibleTasks.length)} tasks held in safe standby.</span>
          <button
            onClick={onExit}
            className="text-xs font-bold text-primary hover:underline"
          >
            Show full workspace
          </button>
        </div>
      </div>
    </div>
  );
}
