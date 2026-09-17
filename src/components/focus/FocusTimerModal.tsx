"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, CheckCircle, BellOff, X, AlertCircle } from "lucide-react";
import { ITask } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import confetti from "canvas-confetti";

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
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        toast.success(`Task completed! Logged ${durationMinutes} minutes.`);
      } else {
        toast.info(`Session saved: logged ${durationMinutes} minutes of focus.`);
      }
      onSessionRecorded();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn">
      <div className="w-full max-w-xl bg-card border border-border/80 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Task Title & Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-4">
          <BellOff className="w-3.5 h-3.5 text-primary" />
          Focus Sanctuary · {task.category}
        </div>

        <h2 className="text-2xl font-semibold text-foreground max-w-md line-clamp-2 mb-2">
          {task.title}
        </h2>

        {task.description && (
          <p className="text-xs text-muted-foreground max-w-sm mb-6 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Timer Display */}
        <div className="my-8">
          <div className="text-7xl font-mono font-bold tracking-tight text-foreground select-none">
            {formattedTime}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Elapsed: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s · Target:{" "}
            {task.estimatedMinutes || 45}m
          </p>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="p-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
          </button>
        </div>

        {/* Interruption Logger */}
        <div className="w-full bg-secondary/30 border border-border/60 rounded-xl p-3 mb-6 text-left">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Logged Interruptions: {interruptions}</span>
            <button
              type="button"
              onClick={() => setInterruptions((prev) => prev + 1)}
              className="text-xs text-primary hover:underline"
            >
              + Record Interruption
            </button>
          </div>
          {interruptions > 0 && (
            <input
              type="text"
              value={interruptionNote}
              onChange={(e) => setInterruptionNote(e.target.value)}
              placeholder="Brief note (e.g. phone call, urgent question)..."
              className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleFinish(false)}
            className="flex-1 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium rounded-xl border border-border/80 transition-colors"
          >
            Save Session & Stop
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleFinish(true)}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Complete Task
          </button>
        </div>
      </div>
    </div>
  );
}
