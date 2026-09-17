"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Clock, CheckCircle2, Play, RefreshCw, X, Zap } from "lucide-react";
import { ITask, ITaskRecommendation } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { formatMinutes, formatDateLabel } from "@/lib/utils";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

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
            `High priority status (${alt.priority})`,
            `Estimated duration: ${alt.estimatedMinutes || 45} minutes`,
            alt.deadline ? `Due: ${formatDateLabel(alt.deadline)}` : "Unblocked and immediately actionable",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg spider-card shadow-2xl overflow-hidden flex flex-col animate-scaleIn">
        {/* Header with Spider-Sense radar indicator */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </div>
            <div className="flex items-center gap-2">
              <SpiderLogo className="w-4 h-4 text-primary" />
              <span className="text-xs font-display font-bold uppercase tracking-widest text-foreground">
                Spider-Sense Decision Engine
              </span>
            </div>
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
            <div className="py-14 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-display font-medium">
                Evaluating dependency graph, deadlines, and current energy...
              </p>
            </div>
          ) : !currentItem ? (
            <div className="py-10 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-display font-bold text-foreground">Zero Critical Bottlenecks</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                No unblocked pending tasks require immediate intervention right now.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-display font-bold tracking-wider uppercase bg-primary/20 text-primary border border-primary/40 flex items-center gap-1 shadow-glow-crimson-sm">
                    <Zap className="w-3 h-3 fill-current" />
                    OPTIMAL TARGET {candidatePool.length > 1 ? `(#${currentIndex + 1}/${candidatePool.length})` : ""}
                  </span>
                  <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-secondary/80 border border-border/70 font-display font-semibold uppercase">
                    {currentItem.task.category}
                  </span>
                </div>

                <h2 className="text-xl font-display font-bold text-foreground leading-snug tracking-tight">
                  {currentItem.task.title}
                </h2>

                {currentItem.task.description && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {currentItem.task.description}
                  </p>
                )}
              </div>

              {/* Explainable Reasoning Block */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80 space-y-2">
                <div className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Algorithm Rationale
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
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1 font-display tabular-nums">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Est: {formatMinutes(currentItem.task.estimatedMinutes || 45)}</span>
                </div>
                {currentItem.task.deadline && (
                  <div className="text-amber-400 font-semibold">
                    Due: {formatDateLabel(currentItem.task.deadline)}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartFocus(currentItem.task);
                  }}
                  className="spider-btn-primary flex-1 py-3"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START FOCUS ({currentItem.task.estimatedMinutes || 45}m)</span>
                </button>

                {candidatePool.length > 1 && (
                  <button
                    type="button"
                    onClick={handleChooseAnother}
                    className="spider-btn-secondary px-4 py-3 justify-center"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Next Option</span>
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
