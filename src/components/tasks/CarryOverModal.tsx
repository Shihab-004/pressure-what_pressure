"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, HelpCircle, Check } from "lucide-react";
import { ITask } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { addDays, format } from "date-fns";

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
      onRescheduled();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            Task Not Completed
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Rescheduling:</p>
          <p className="text-sm font-medium text-foreground">{task.title}</p>
        </div>

        {/* Reason Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
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
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  reason === opt.key
                    ? "bg-primary/10 border-primary/50 text-foreground"
                    : "bg-secondary/40 border-border/70 text-muted-foreground hover:bg-secondary"
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
          <label className="text-xs font-medium text-muted-foreground">Move to date:</label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
          />
        </div>

        {/* Action Buttons */}
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
            onClick={handleConfirm}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            Confirm Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}
