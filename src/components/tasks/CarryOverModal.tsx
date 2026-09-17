"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, HelpCircle, Check } from "lucide-react";
import { ITask } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { SpiderLogo } from "@/components/icons/SpiderLogo";
import { taskSync } from "@/lib/events/taskSync";

interface CarryOverModalProps {
  task: ITask | null;
  isOpen: boolean;
  onClose: () => void;
  onRescheduled: () => void;
}

export function CarryOverModal({ task, isOpen, onClose, onRescheduled }: CarryOverModalProps) {
  const [reason, setReason] = useState<ITask["carryOverReason"]>("not_enough_time");
  const [newDate, setNewDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);
  const { apiFetch } = useApi();

  if (!isOpen || !task) return null;

  async function handleConfirm() {
    if (!task) return;
    setSaving(true);

    const { error } = await apiFetch(`/api/tasks/${task._id}`, {
      method: "PATCH",
      body: JSON.stringify({
        scheduledDate: newDate,
        carryOverReason: reason,
        carryOverCount: (task.carryOverCount || 0) + 1,
        status: "planned",
      }),
    });

    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.info(`Task rescheduled to ${newDate} (${reason?.replace(/_/g, " ")})`);
      taskSync.notify({ type: "task:rescheduled", taskId: task._id });
      onRescheduled();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl p-6 space-y-4 glass-panel animate-scaleIn">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Task Not Completed</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-secondary/40 border border-border/70 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Rescheduling Action:</p>
          <p className="text-sm font-medium text-foreground">{task.title}</p>
        </div>

        {/* Reason Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Why couldn't this be finished today?
          </label>
          <div className="grid grid-cols-1 gap-2">
            {[
              { key: "not_enough_time", label: "Not enough time / Overloaded" },
              { key: "too_difficult", label: "Too difficult / Needs research" },
              { key: "distracted", label: "Distracted / Low energy" },
              { key: "no_longer_important", label: "No longer important / Deprioritized" },
              { key: "other", label: "Other external blocker" },
            ].map((opt) => (
              <label
                key={opt.key}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  reason === opt.key
                    ? "bg-primary/15 border-primary/50 text-foreground font-medium shadow-glow-crimson-sm"
                    : "bg-secondary/40 border-border/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="carryOverReason"
                  value={opt.key}
                  checked={reason === opt.key}
                  onChange={() => setReason(opt.key as any)}
                  className="accent-primary"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Target Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Move to date:</label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full px-3 py-2 bg-secondary/50 border border-border/80 rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleConfirm}
            className="px-4 py-2 bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-glow-crimson-sm border border-red-400/30 transition-all active:scale-95"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            Confirm Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}
