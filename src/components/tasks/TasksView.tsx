"use client";

import React, { useState, useEffect } from "react";
import { CheckSquare, Plus, Search, Filter, AlertCircle, RefreshCw } from "lucide-react";
import { ITask } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { TaskCard } from "./TaskCard";
import { QuickAddBar } from "./QuickAddBar";
import { isTaskBlocked } from "@/lib/engine/recommendationEngine";

interface TasksViewProps {
  onStartFocus: (task: ITask) => void;
  onReschedule: (task: ITask) => void;
  onOpenNewTask: () => void;
  onEditTask: (task: ITask) => void;
}

export function TasksView({
  onStartFocus,
  onReschedule,
  onOpenNewTask,
  onEditTask,
}: TasksViewProps) {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "today" | "inbox" | "overdue" | "completed">("active");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { apiFetch } = useApi();

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    const { data, error } = await apiFetch("/api/tasks");
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      setTasks(data?.tasks || []);
    }
  }

  async function handleToggleComplete(task: ITask) {
    const isComp = task.status === "completed";
    const nextStatus = isComp ? "inbox" : "completed";

    // Optimistic local state update
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, status: nextStatus } : t))
    );

    const { error } = await apiFetch(`/api/tasks/${task._id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });

    if (error) {
      toast.error(error);
      loadTasks();
    } else {
      toast.success(isComp ? "Task reopened" : "Task completed!");
    }
  }

  async function handleDelete(taskId: string) {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    toast.info("Task deleted");
  }

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchCat && !matchDesc) return false;
    }

    // Category filter
    if (selectedCategory !== "All" && t.category !== selectedCategory) {
      return false;
    }

    // Status Tab filter
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (activeTab === "active") {
      return t.status !== "completed" && t.status !== "cancelled";
    }
    if (activeTab === "today") {
      return (
        t.status === "today" ||
        t.status === "in_progress" ||
        (t.scheduledDate === todayStr && t.status !== "cancelled")
      );
    }
    if (activeTab === "inbox") {
      return t.status === "inbox";
    }
    if (activeTab === "overdue") {
      return (
        t.status !== "completed" &&
        t.status !== "cancelled" &&
        t.deadline &&
        new Date(t.deadline).getTime() < now.getTime()
      );
    }
    if (activeTab === "completed") {
      return t.status === "completed";
    }

    return true;
  });

  const categories = ["All", "University", "Rover", "Learning", "Career", "Business", "Personal"];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-primary" />
            Task Registry & Priority Matrix
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            All Work & Actions
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenNewTask}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Task
        </button>
      </div>

      {/* Quick Add Bar */}
      <QuickAddBar onTaskCreated={loadTasks} />

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            {[
              { key: "active", label: "Active" },
              { key: "today", label: "Today" },
              { key: "inbox", label: "Inbox" },
              { key: "overdue", label: "Overdue" },
              { key: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="w-full pl-9 pr-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-secondary text-foreground border-primary/50"
                  : "bg-transparent text-muted-foreground border-border/70 hover:bg-secondary/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-2">
          <CheckSquare className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium text-foreground">No tasks match the current filters.</p>
          <p className="text-xs text-muted-foreground">
            Clear filters or use Quick Add to create a new task.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const blocked = isTaskBlocked(task, tasks);
            return (
              <TaskCard
                key={task._id}
                task={task}
                isBlocked={blocked}
                onToggleComplete={handleToggleComplete}
                onStartFocus={onStartFocus}
                onReschedule={onReschedule}
                onEdit={onEditTask}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
