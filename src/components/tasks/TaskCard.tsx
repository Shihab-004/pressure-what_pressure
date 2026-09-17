"use client";

import React from "react";
import {
  Clock,
  Calendar,
  Play,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { ITask } from "@/types";
import { formatMinutes, formatDateLabel } from "@/lib/utils";

interface TaskCardProps {
  task: ITask;
  onToggleComplete: (task: ITask) => void;
  onStartFocus: (task: ITask) => void;
  onReschedule: (task: ITask) => void;
  onEdit?: (task: ITask) => void;
  onDelete?: (taskId: string) => void;
  isBlocked?: boolean;
}

export function TaskCard({
  task,
  onToggleComplete,
  onStartFocus,
  onReschedule,
  onEdit,
  onDelete,
  isBlocked = false,
}: TaskCardProps) {
  const isCompleted = task.status === "completed";

  // Check if overdue
  let isOverdue = false;
  if (task.deadline && !isCompleted) {
    isOverdue = new Date(task.deadline).getTime() < new Date().getTime();
  }

  return (
    <div
      className={`group relative p-4 rounded-xl border transition-all duration-150 ${
        isCompleted
          ? "bg-card/30 border-border/40 opacity-70"
          : isBlocked
          ? "bg-card/50 border-amber-500/30"
          : "bg-card/80 border-border/70 hover:border-border hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
            isCompleted
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "border-border/80 hover:border-primary text-transparent hover:text-primary/40 bg-secondary/30"
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category tag */}
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-secondary text-secondary-foreground border border-border/60">
              {task.category}
            </span>

            {/* Priority tag */}
            {task.priority === "critical" && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wide">
                Critical
              </span>
            )}
            {task.priority === "high" && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wide">
                High
              </span>
            )}

            {/* Blocked or Prerequisite badge */}
            {isBlocked && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                Blocked by prerequisite
              </span>
            )}

            {/* Carry-over count */}
            {task.carryOverCount && task.carryOverCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground border border-border flex items-center gap-1">
                <RotateCcw className="w-2.5 h-2.5" />
                {task.carryOverCount}x carried
              </span>
            ) : null}
          </div>

          <h3
            className={`text-sm font-medium leading-snug break-words ${
              isCompleted ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            {task.title}
          </h3>

          {task.description && !isCompleted && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}

          {/* Meta bottom info */}
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground flex-wrap">
            {/* Duration */}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>{formatMinutes(task.estimatedMinutes || 45)}</span>
              {task.actualMinutes && task.actualMinutes > 0 ? (
                <span className="text-foreground/70 font-mono text-[11px]">
                  (actual: {formatMinutes(task.actualMinutes)})
                </span>
              ) : null}
            </div>

            {/* Deadline */}
            {task.deadline && (
              <div
                className={`flex items-center gap-1 ${
                  isOverdue ? "text-red-400 font-medium" : ""
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>{formatDateLabel(task.deadline)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons (hover or mobile visible) */}
        <div className="flex items-center gap-1.5">
          {!isCompleted && !isBlocked && (
            <button
              type="button"
              onClick={() => onStartFocus(task)}
              title="Start Focus Mode"
              className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {!isCompleted && (
            <button
              type="button"
              onClick={() => onReschedule(task)}
              title="Reschedule / Postpone"
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task._id)}
              title="Delete Task"
              className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
