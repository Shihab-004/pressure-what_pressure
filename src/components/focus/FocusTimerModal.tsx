"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, CheckCircle, BellOff, X, AlertCircle, Sparkles } from "lucide-react";
import { ITask } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

interface FocusTimerModalProps {
  task: ITask | null;
  isOpen: boolean;
  onClose: () => void;
  onSessionRecorded: () => void;
}

export function FocusTimerModal({
  task,
  isOpen,
  onClose,
  onSessionRecorded,
}: FocusTimerModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [interruptions, setInterruptions] = useState(0);
  const [interruptionNote, setInterruptionNote] = useState("");
  const [saving, setSaving] = useState(false);

  const startTimeRef = useRef<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { apiFetch } = useApi();

  useEffect(() => {
    if (isOpen && task) {
      const targetSec = (task.estimatedMinutes || 45) * 60;
      setSecondsRemaining(targetSec);
      setElapsedSeconds(0);
      setInterruptions(0);
      setInterruptionNote("");
      setIsRunning(true);
      startTimeRef.current = new Date();
    } else {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, task]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  if (!isOpen || !task) return null;

  const displayHours = Math.floor(secondsRemaining / 3600);
  const displayMinutes = Math.floor((secondsRemaining % 3600) / 60);
  const displaySecs = secondsRemaining % 60;

  const formattedTime =
    displayHours > 0
      ? `${String(displayHours).padStart(2, "0")}:${String(displayMinutes).padStart(2, "0")}:${String(
          displaySecs
        ).padStart(2, "0")}`
      : `${String(displayMinutes).padStart(2, "0")}:${String(displaySecs).padStart(2, "0")}`;

  async function handleFinish(isCompleted: boolean) {
    setSaving(true);
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    const { error } = await apiFetch("/api/focus", {
      method: "POST",
      body: JSON.stringify({
        taskId: task?._id,
        startedAt: startTimeRef.current?.toISOString() || new Date().toISOString(),
        durationMinutes,
        completed: isCompleted,
        interruptions,
        notes: interruptionNote,
      }),
    });

    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      if (isCompleted) {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        toast.success(`Task completed! Logged ${durationMinutes} minutes of deep focus.`);
      } else {
        toast.info(`Session recorded: logged ${durationMinutes} minutes of focus.`);
      }
      onSessionRecorded();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-xl spider-card p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl relative animate-scaleIn">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Task Title & Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 text-xs font-display font-semibold mb-3 shadow-glow-crimson-sm">
          <SpiderLogo className="w-3.5 h-3.5 text-primary" />
          <span>Deep Focus Protocol · {task.category}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground max-w-md line-clamp-2 mb-2 leading-snug">
          {task.title}
        </h2>

        {task.description && (
          <p className="text-xs text-muted-foreground max-w-sm mb-4 line-clamp-2 leading-relaxed font-sans">
            {task.description}
          </p>
        )}

        {/* Timer Display with Space Grotesk Digital Readout */}
        <div className="my-6 sm:my-8 relative">
          <div className="text-6xl sm:text-7xl font-display font-black tracking-tight tabular-nums text-foreground select-none drop-shadow-[0_0_30px_rgba(229,9,20,0.5)]">
            {formattedTime}
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-display tabular-nums tracking-wide">
            Elapsed: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s · Target:{" "}
            {task.estimatedMinutes || 45}m
          </p>
        </div>

        {/* Timer Control Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary via-red-600 to-rose-600 hover:from-primary/90 hover:to-rose-500 text-white flex items-center justify-center shadow-glow-crimson border-2 border-red-400/40 active:scale-95 transition-all"
            title={isRunning ? "Pause" : "Resume"}
          >
            {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
          </button>
        </div>

        {/* Interruption Logger */}
        <div className="w-full bg-secondary/40 border border-border/80 rounded-xl p-3.5 mb-6 text-left">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 font-display">
            <span className="font-semibold text-foreground/90">Logged Interruptions: {interruptions}</span>
            <button
              type="button"
              onClick={() => setInterruptions((prev) => prev + 1)}
              className="text-xs text-primary font-bold hover:underline"
            >
              + Log Interruption
            </button>
          </div>
          {interruptions > 0 && (
            <input
              type="text"
              value={interruptionNote}
              onChange={(e) => setInterruptionNote(e.target.value)}
              placeholder="Brief note (context switch, urgent communication)..."
              className="w-full px-3 py-1.5 bg-card border border-border/80 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleFinish(false)}
            className="spider-btn-secondary flex-1 py-3"
          >
            Save & Exit
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleFinish(true)}
            className="spider-btn-emerald flex-1 py-3"
          >
            <CheckCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Mark Complete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
