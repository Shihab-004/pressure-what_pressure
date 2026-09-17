"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, Smile, Meh, Frown, X, Check, Loader2 } from "lucide-react";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { formatMinutes } from "@/lib/utils";

interface DailyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyReviewModal({ isOpen, onClose }: DailyReviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ completedCount: 0, missedCount: 0, focusTimeMinutes: 0 });
  const [mood, setMood] = useState<"good" | "normal" | "overloaded">("good");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { apiFetch } = useApi();

  useEffect(() => {
    if (isOpen) {
      loadTodayStats();
    }
  }, [isOpen]);

  async function loadTodayStats() {
    setLoading(true);
    const { data } = await apiFetch("/api/reviews/daily");
    setLoading(false);

    if (data?.stats) {
      setStats(data.stats);
    }
    if (data?.existingReview) {
      setMood(data.existingReview.mood || "normal");
      setNotes(data.existingReview.notes || "");
    }
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await apiFetch("/api/reviews/daily", {
      method: "POST",
      body: JSON.stringify({
        ...stats,
        mood,
        notes,
      }),
    });
    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Daily review recorded! Rest well.");
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Day Review & Reflection</h3>
            <p className="text-xs text-muted-foreground">Close out today's loop cleanly.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-3 rounded-xl bg-secondary/50 border border-border">
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
              Completed
            </span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {stats.completedCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/50 border border-border">
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
              Pending
            </span>
            <span className="text-lg font-bold font-mono text-amber-400">{stats.missedCount}</span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/50 border border-border">
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
              Focus Time
            </span>
            <span className="text-lg font-bold font-mono text-primary">
              {formatMinutes(stats.focusTimeMinutes)}
            </span>
          </div>
        </div>

        {/* Mood Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">How was today overall?</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "good", label: "Good", icon: Smile, color: "text-emerald-400" },
              { key: "normal", label: "Normal", icon: Meh, color: "text-sky-400" },
              { key: "overloaded", label: "Overloaded", icon: Frown, color: "text-red-400" },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMood(m.key as any)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-medium ${
                    mood === m.key
                      ? "bg-primary/10 border-primary text-foreground shadow-sm"
                      : "bg-secondary/40 border-border/80 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${m.color}`} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Optional Note / Takeaway:
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key win, lesson learned, or tomorrow's reminder..."
            className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 resize-none font-sans"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save Review
          </button>
        </div>
      </div>
    </div>
  );
}
