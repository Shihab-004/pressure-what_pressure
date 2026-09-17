"use client";

import React, { useState, useMemo } from "react";
import { parseSingleQuickAdd } from "@/lib/engine/brainDumpParser";
import { Plus, Clock, Calendar, Tag, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/lib/api/useApi";
import { formatDateLabel } from "@/lib/utils";

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
      if (onTaskCreated) onTaskCreated();
    }
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleQuickAdd} className="relative flex items-center">
        <div className="absolute left-3.5 text-muted-foreground pointer-events-none">
          <Plus className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Quick Add: 'Finish OSI assignment tomorrow 8 PM' or 'Fix Rover bug tonight 1h'..."
          className="w-full pl-10 pr-24 py-2.5 bg-card/60 hover:bg-card/90 focus:bg-card border border-border/80 focus:border-primary/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all shadow-sm"
        />

        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="absolute right-2 px-3 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary text-primary-foreground text-xs font-medium rounded-md transition-all flex items-center gap-1.5 shadow-sm"
        >
          {submitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              Add
              <ArrowRight className="w-3 h-3" />
            </>
          )}
        </button>
      </form>

      {/* Live parsing detection badge row */}
      {detected && (
        <div className="flex flex-wrap items-center gap-2 mt-2 px-1 text-xs text-muted-foreground animate-fadeIn">
          <span className="font-medium text-foreground/80">Detected:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/80 text-secondary-foreground border border-border/60">
            <Tag className="w-3 h-3 text-primary" />
            {detected.category}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/80 text-secondary-foreground border border-border/60">
            <Clock className="w-3 h-3 text-sky-400" />
            {detected.estimatedMinutes}m
          </span>
          {detected.deadline && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/80 text-secondary-foreground border border-border/60">
              <Calendar className="w-3 h-3 text-amber-400" />
              {formatDateLabel(detected.deadline)}
            </span>
          )}
          {detected.priority === "high" || detected.priority === "critical" ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
              {detected.priority.toUpperCase()}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
