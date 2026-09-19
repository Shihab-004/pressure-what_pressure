"use client";

import React, { useState, useEffect } from "react";
import { CheckSquare, Plus, Search, Filter, AlertCircle, RefreshCw } from "lucide-react";
import { ITask } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { TaskCard } from "./TaskCard";
import { isTaskBlocked } from "@/lib/engine/recommendationEngine";
import { SpiderLogo } from "@/components/icons/SpiderLogo";
import { taskSync } from "@/lib/events/taskSync";
import { ArrowUpDown } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { TaskCardSkeleton } from "@/components/ui/Skeleton";

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
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "today" | "inbox" | "overdue" | "completed">("active");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "created">("deadline");

  const { apiFetch } = useApi();

  useEffect(() => {
    if (!authLoading) {
      loadTasks();
    }
    const unsubscribe = taskSync.subscribe(() => {
      loadTasks(true);
    });
    return unsubscribe;
  }, [authLoading, user]);

  async function loadTasks(silent = false) {
    if (!silent) setLoading(true);
    const { data, error } = await apiFetch("/api/tasks");
    if (!silent) setLoading(false);

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
      taskSync.notify({ type: "task:completed", taskId: task._id });
    }
  }

  async function handleDelete(taskId: string) {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    toast.info("Task deleted");
    taskSync.notify({ type: "task:deleted", taskId });
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

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "deadline") {
      const nowMs = Date.now();
      const aDone = a.status === "completed" || a.status === "cancelled";
      const bDone = b.status === "completed" || b.status === "cancelled";
      if (aDone !== bDone) return aDone ? 1 : -1;

      const aDeadline = a.deadline ? new Date(a.deadline).getTime() : null;
      const bDeadline = b.deadline ? new Date(b.deadline).getTime() : null;

      const aOverdue = aDeadline !== null && aDeadline < nowMs;
      const bOverdue = bDeadline !== null && bDeadline < nowMs;

      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      if (aOverdue && bOverdue) return (aDeadline || 0) - (bDeadline || 0);

      if (aDeadline !== null && bDeadline !== null) return aDeadline - bDeadline;
      if (aDeadline !== null && bDeadline === null) return -1;
      if (aDeadline === null && bDeadline !== null) return 1;

      return (b.dynamicScore || 0) - (a.dynamicScore || 0);
    }
    if (sortBy === "priority") {
      const pOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      const pDiff = (pOrder[b.priority] || 2) - (pOrder[a.priority] || 2);
      if (pDiff !== 0) return pDiff;
      return (b.dynamicScore || 0) - (a.dynamicScore || 0);
    }
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const categories = ["All", "University", "Rover", "Learning", "Career", "Business", "Personal"];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-display font-bold flex items-center gap-1.5">
            <SpiderLogo className="w-4 h-4 text-primary" />
            Task Registry & Priority Matrix
          </div>
          <h1 className="text-2xl font-display font-extrabold tracking-tight text-foreground">
            All Work & Actions
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenNewTask}
          className="spider-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/80 pb-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-display tracking-wide uppercase transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-primary text-white shadow-glow-crimson font-bold border border-red-400/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box & Sort Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registry..."
                className="w-full pl-9 pr-3 py-1.5 bg-secondary/50 border border-border/80 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 font-sans"
              />
            </div>

            <div className="relative flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 px-2.5 py-1 text-xs bg-secondary/60 border border-border/80 rounded-xl text-foreground font-display font-medium focus:outline-none focus:ring-1 focus:ring-primary/60 cursor-pointer"
                title="Sort Tasks"
              >
                <option value="deadline">⏳ Near Deadline</option>
                <option value="priority">🔥 High Priority</option>
                <option value="created">✨ Newest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-[11px] font-display font-medium uppercase tracking-wider border transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-primary/20 text-primary border-primary/50 font-bold shadow-glow-crimson-sm"
                  : "bg-secondary/40 text-muted-foreground border-border/80 hover:bg-secondary hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((idx) => (
            <TaskCardSkeleton key={idx} />
          ))}
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="spider-card p-10 text-center space-y-2.5">
          <CheckSquare className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <p className="text-sm font-display font-bold text-foreground">No tasks match criteria</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Use the Quick Add bar above to register a new target.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedTasks.map((task) => {
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
