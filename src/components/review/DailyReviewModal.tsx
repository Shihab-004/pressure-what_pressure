"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, Smile, Meh, Frown, X, Check, Loader2 } from "lucide-react";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { formatMinutes } from "@/lib/utils";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md spider-card p-6 space-y-5 shadow-2xl animate-scaleIn">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <SpiderLogo className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-base font-display font-bold text-foreground">Day Closeout & Reflection</h3>
              <p className="text-[11px] text-muted-foreground">Close out execution loop cleanly.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 shadow-2xs">
            <span className="text-muted-foreground block text-[10px] uppercase font-display font-bold">
              Completed
            </span>
            <span className="text-lg font-display font-extrabold tabular-nums text-emerald-400">
              {stats.completedCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 shadow-2xs">
            <span className="text-muted-foreground block text-[10px] uppercase font-display font-bold">
              Pending
            </span>
            <span className="text-lg font-display font-extrabold tabular-nums text-amber-400">{stats.missedCount}</span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 shadow-2xs">
            <span className="text-muted-foreground block text-[10px] uppercase font-display font-bold">
              Focus Time
            </span>
            <span className="text-lg font-display font-extrabold tabular-nums text-primary">
              {formatMinutes(stats.focusTimeMinutes)}
            </span>
          </div>
        </div>

        {/* Mood Selector */}
        <div className="space-y-2">
          <label className="text-xs font-display font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">How was today overall?</label>
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
                  className={`p-2.5 rounded-xl border text-xs font-display font-semibold flex flex-col items-center gap-1 transition-all ${
                    mood === m.key
                      ? "bg-primary/20 border-primary/50 text-white shadow-glow-crimson-sm"
                      : "bg-secondary/40 border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${m.color}`} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-display font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
            Reflection Note:
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key breakthrough or lesson learned..."
            className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/60 resize-none font-sans"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/80">
          <button
            type="button"
            onClick={onClose}
            className="spider-btn-secondary spider-btn-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="spider-btn-primary spider-btn-sm"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
            <span>Save Review</span>
          </button>
        </div>
      </div>
    </div>
  );
}
