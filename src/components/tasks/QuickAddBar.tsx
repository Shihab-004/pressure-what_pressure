"use client";

import React, { useState, useMemo } from "react";
import { parseSingleQuickAdd } from "@/lib/engine/brainDumpParser";
import { Plus, Clock, Calendar, Tag, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/lib/api/useApi";
import { formatDateLabel } from "@/lib/utils";
import { taskSync } from "@/lib/events/taskSync";

interface QuickAddBarProps {
  onTaskCreated?: () => void;
  className?: string;
  defaultCategory?: string;
}

export function QuickAddBar({ onTaskCreated, className = "", defaultCategory }: QuickAddBarProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { apiFetch } = useApi();

  // Real-time live detection
  const detected = useMemo(() => {
    if (!text.trim()) return null;
    const parsed = parseSingleQuickAdd(text);
    if (defaultCategory && parsed.category === "Personal") {
      parsed.category = defaultCategory;
    }
    return parsed;
  }, [text, defaultCategory]);

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    const parsed = parseSingleQuickAdd(text);
    if (defaultCategory && parsed.category === "Personal") {
      parsed.category = defaultCategory;
    }

    const { error } = await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: parsed.title,
        category: parsed.category,
        priority: parsed.priority,
        estimatedMinutes: parsed.estimatedMinutes,
        deadline: parsed.deadline,
        status: parsed.deadline ? "planned" : "inbox",
        scheduledDate: parsed.deadline ? parsed.deadline.split("T")[0] : null,
        source: "quick_add",
      }),
    });

    setSubmitting(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(`Captured: "${parsed.title}"`);
      setText("");
      taskSync.notify({ type: "task:created" });
      if (onTaskCreated) onTaskCreated();
    }
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleQuickAdd} className="relative flex items-center">
        <div className="absolute left-3.5 text-primary pointer-events-none">
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Capture target (e.g. 'Study Physics 45m')..."
          className="w-full pl-10 pr-24 py-2.5 bg-secondary/40 hover:bg-secondary/70 focus:bg-card border border-border/80 focus:border-primary/60 rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-sans"
        />

        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="spider-btn-primary spider-btn-sm absolute right-1.5 py-1.5 px-3 disabled:opacity-35"
        >
          {submitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <span>Add</span>
              <ArrowRight className="w-3 h-3 stroke-[2.5]" />
            </>
          )}
        </button>
      </form>

      {/* Live parsing detection badge row */}
      {detected && (
        <div className="flex flex-wrap items-center gap-2 mt-2 px-1 text-xs text-muted-foreground animate-fadeIn font-display">
          <span className="font-bold text-foreground/80 text-[10px] uppercase tracking-wider">Detected:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-semibold border border-border">
            <Tag className="w-3 h-3 text-primary" />
            {detected.category}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-semibold tabular-nums border border-border">
            <Clock className="w-3 h-3 text-sky-400" />
            {detected.estimatedMinutes}m
          </span>
          {detected.deadline && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-semibold border border-border">
              <Calendar className="w-3 h-3 text-amber-400" />
              {formatDateLabel(detected.deadline)}
            </span>
          )}
          {(detected.priority === "high" || detected.priority === "critical") && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
              {detected.priority}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
