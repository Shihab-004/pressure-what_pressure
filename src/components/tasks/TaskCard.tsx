"use client";

import React from "react";
import {
  Clock,
  Calendar,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Edit3,
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
      className={`group relative p-4 rounded-xl border transition-all duration-200 ${
        isCompleted
          ? "bg-card/25 border-border/30 opacity-60"
          : isBlocked
          ? "bg-card/60 border-amber-500/30 shadow-2xs"
          : "spider-card hover:border-primary/50"
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Completion Checkbox with Smooth Web-Snap Feedback */}
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
            isCompleted
              ? "bg-emerald-500 border-emerald-500 text-white shadow-xs animate-web-snap"
              : "border-border/80 hover:border-primary text-transparent hover:text-primary/50 bg-secondary/50"
          }`}
          title={isCompleted ? "Mark incomplete" : "Mark completed"}
        >
          <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Content Body */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category tag */}
            <span className="px-2 py-0.5 rounded text-[10px] font-display font-semibold uppercase tracking-wider bg-secondary/80 text-secondary-foreground border border-border/70">
              {task.category}
            </span>

            {/* Priority tag with Spider-Sense alert if critical */}
            {task.priority === "critical" && (
              <span className="px-2 py-0.5 rounded text-[10px] font-display font-bold bg-red-500/15 text-red-400 border border-red-500/30 uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                Critical
              </span>
            )}
            {task.priority === "high" && (
              <span className="px-2 py-0.5 rounded text-[10px] font-display font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
                High
              </span>
            )}

            {/* Blocked or Prerequisite badge */}
            {isBlocked && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Blocked
              </span>
            )}

            {/* Carry-over count */}
            {task.carryOverCount && task.carryOverCount > 0 ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-display font-medium tabular-nums bg-secondary/80 text-muted-foreground border border-border flex items-center gap-1">
                <RotateCcw className="w-2.5 h-2.5" />
                {task.carryOverCount}x carried
              </span>
            ) : null}
          </div>

          <h3
            onClick={() => onEdit?.(task)}
            className={`text-sm font-semibold leading-snug break-words cursor-pointer hover:text-primary transition-colors ${
              isCompleted ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            {task.title}
          </h3>

          {task.description && !isCompleted && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Meta bottom info */}
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground flex-wrap">
            {/* Duration */}
            <div className="flex items-center gap-1 font-display tabular-nums">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{formatMinutes(task.estimatedMinutes || 45)}</span>
              {task.actualMinutes && task.actualMinutes > 0 ? (
                <span className="text-foreground/70 text-[11px]">
                  (actual: {formatMinutes(task.actualMinutes)})
                </span>
              ) : null}
            </div>

            {/* Deadline with Overdue indicator */}
            {task.deadline && (
              <div
                className={`flex items-center gap-1 font-display tabular-nums ${
                  isOverdue ? "text-red-400 font-semibold" : ""
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Due: {formatDateLabel(task.deadline)}</span>
                {isOverdue && <span className="text-[10px] uppercase font-bold tracking-wider ml-1 bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/30">Overdue</span>}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isCompleted && !isBlocked && (
            <button
              type="button"
              onClick={() => onStartFocus(task)}
              title="Start Focus Mode"
              className="spider-btn-primary spider-btn-icon"
            >
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </button>
          )}

          {!isCompleted && (
            <button
              type="button"
              onClick={() => onReschedule(task)}
              title="Reschedule / Carry Over"
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              title="Edit Task"
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors opacity-70 sm:opacity-0 group-hover:opacity-100"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task._id)}
              title="Delete Task"
              className="p-2 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-secondary transition-colors opacity-70 sm:opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
