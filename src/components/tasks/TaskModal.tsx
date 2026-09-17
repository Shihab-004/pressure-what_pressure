"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { ITask, TaskCategory, TaskPriority, TaskStatus } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  taskToEdit?: ITask | null;
  existingTasks?: ITask[];
}

export function TaskModal({
  isOpen,
  onClose,
  onSaved,
  taskToEdit,
  existingTasks = [],
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("Personal");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("inbox");
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [deadline, setDeadline] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { apiFetch } = useApi();

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setCategory(taskToEdit.category);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setEstimatedMinutes(taskToEdit.estimatedMinutes || 45);
      setDeadline(taskToEdit.deadline ? taskToEdit.deadline.split("T")[0] : "");
      setScheduledDate(taskToEdit.scheduledDate || "");
      setDependencies(taskToEdit.dependencies || []);
    } else {
      setTitle("");
      setDescription("");
      setCategory("Personal");
      setPriority("medium");
      setStatus("inbox");
      setEstimatedMinutes(45);
      setDeadline("");
      setScheduledDate("");
      setDependencies([]);
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    const payload = {
      title,
      description,
      category,
      priority,
      status,
      estimatedMinutes,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      scheduledDate: scheduledDate || null,
      dependencies,
    };

    let error;
    if (taskToEdit) {
      const res = await apiFetch(`/api/tasks/${taskToEdit._id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      error = res.error;
    } else {
      const res = await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      error = res.error;
    }

    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(taskToEdit ? "Task updated" : "Task created");
      onSaved();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-semibold text-foreground">
            {taskToEdit ? "Edit Task" : "Create New Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-medium text-muted-foreground mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish Control Systems Lab Report"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-muted-foreground mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context, requirements, links..."
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 resize-none"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-muted-foreground mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none"
              >
                <option value="University">University</option>
                <option value="Rover">Rover</option>
                <option value="Learning">Learning</option>
                <option value="Career">Career</option>
                <option value="Business">Business</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-muted-foreground mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Duration & Scheduled Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-muted-foreground mb-1">
                Estimated Duration (min)
              </label>
              <input
                type="number"
                min={5}
                max={480}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 45)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-muted-foreground mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none"
              >
                <option value="inbox">Inbox</option>
                <option value="planned">Planned</option>
                <option value="today">Today</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Dates: Deadline & Scheduled Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-muted-foreground mb-1">
                Hard Deadline (Optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-muted-foreground mb-1">
                Scheduled Plan Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Prerequisites / Dependencies */}
          {existingTasks.length > 0 && (
            <div>
              <label className="block font-medium text-muted-foreground mb-1">
                Prerequisite Dependency (Must finish first)
              </label>
              <select
                value={dependencies[0] || ""}
                onChange={(e) => setDependencies(e.target.value ? [e.target.value] : [])}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none"
              >
                <option value="">None (Ready immediately)</option>
                {existingTasks
                  .filter((t) => !taskToEdit || t._id !== taskToEdit._id)
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} ({t.category})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {taskToEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
