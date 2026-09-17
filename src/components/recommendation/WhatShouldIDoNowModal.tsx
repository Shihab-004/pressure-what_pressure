"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Clock, CheckCircle2, Play, RefreshCw, X, AlertCircle, ArrowRight } from "lucide-react";
import { ITask, ITaskRecommendation } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { formatMinutes, formatDateLabel } from "@/lib/utils";

interface WhatShouldIDoNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFocus: (task: ITask) => void;
  onTaskCompleted?: () => void;
}

export function WhatShouldIDoNowModal({
  isOpen,
  onClose,
  onStartFocus,
  onTaskCompleted,
}: WhatShouldIDoNowModalProps) {
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<ITaskRecommendation | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { apiFetch } = useApi();

  useEffect(() => {
    if (isOpen) {
      fetchRecommendation();
    }
  }, [isOpen]);

  async function fetchRecommendation() {
    setLoading(true);
    setCurrentIndex(0);
    const { data, error } = await apiFetch("/api/tasks/recommendation");
    setLoading(false);

    if (error) {
      toast.error(error);
    } else if (data?.recommendation) {
      setRecommendation(data.recommendation);
    } else {
      setRecommendation(null);
    }
  }

  if (!isOpen) return null;

  // Determine current active task to display (primary vs alternatives)
  const candidatePool: Array<{ task: ITask; reasons: string[] }> = [];
  if (recommendation?.task) {
    candidatePool.push({
      task: recommendation.task,
      reasons: recommendation.reasons,
    });
    if (recommendation.alternativeTasks) {
      recommendation.alternativeTasks.forEach((alt) => {
        candidatePool.push({
          task: alt,
          reasons: [
            `High priority (${alt.priority})`,
            `Estimated ${alt.estimatedMinutes || 45} minutes`,
            alt.deadline ? `Due ${formatDateLabel(alt.deadline)}` : "Next best actionable task",
          ],
        });
      });
    }
  }

  const currentItem = candidatePool[currentIndex % (candidatePool.length || 1)];

  function handleChooseAnother() {
    if (candidatePool.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % candidatePool.length);
    } else {
      toast.info("No other unblocked pending tasks found right now.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-gradient-to-r from-card to-secondary/30">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Personal Decision Engine
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">
                Evaluating urgency, dependencies, and available workload...
              </p>
            </div>
          ) : !currentItem ? (
            <div className="py-10 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-medium text-foreground">You are completely clear!</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                No actionable pending tasks require immediate attention right now. Take a breather or capture new ideas in the Inbox.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                    🎯 DO THIS NOW {candidatePool.length > 1 ? `(#${currentIndex + 1} of ${candidatePool.length})` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-secondary/80 border border-border/60">
                    {currentItem.task.category}
                  </span>
                </div>

                <h2 className="text-xl font-semibold text-foreground leading-snug tracking-tight">
                  {currentItem.task.title}
                </h2>

                {currentItem.task.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {currentItem.task.description}
                  </p>
                )}
              </div>

              {/* Explainable Reasoning */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/70 space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Why this task right now?
                </div>
                <ul className="space-y-1.5 text-xs text-foreground/90">
                  {currentItem.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-bold leading-tight">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Task Meta details */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Estimated: {formatMinutes(currentItem.task.estimatedMinutes || 45)}</span>
                </div>
                {currentItem.task.deadline && (
                  <div>Due: {formatDateLabel(currentItem.task.deadline)}</div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartFocus(currentItem.task);
                  }}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  START FOCUS ({currentItem.task.estimatedMinutes || 45}m)
                </button>

                {candidatePool.length > 1 && (
                  <button
                    type="button"
                    onClick={handleChooseAnother}
                    className="px-3.5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border/80 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Next Best
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
