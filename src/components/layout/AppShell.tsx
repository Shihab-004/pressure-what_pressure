"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "./CommandPalette";

// Feature Views
import { CommandCenter } from "@/components/dashboard/CommandCenter";
import { TasksView } from "@/components/tasks/TasksView";
import { DailyPlannerView } from "@/components/planner/DailyPlannerView";
import { WeeklyPlannerView } from "@/components/planner/WeeklyPlannerView";
import { UniversityView } from "@/components/university/UniversityView";
import { LearningRoadmapView } from "@/components/learning/LearningRoadmapView";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { GoalHierarchyView } from "@/components/goals/GoalHierarchyView";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { SettingsView } from "@/components/settings/SettingsView";

// Modals & Overwhelm Sanctuary
import { WhatShouldIDoNowModal } from "@/components/recommendation/WhatShouldIDoNowModal";
import { FocusTimerModal } from "@/components/focus/FocusTimerModal";
import { BrainDumpModal } from "@/components/braindump/BrainDumpModal";
import { TaskModal } from "@/components/tasks/TaskModal";
import { CarryOverModal } from "@/components/tasks/CarryOverModal";
import { DailyReviewModal } from "@/components/review/DailyReviewModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { OverwhelmMode } from "@/components/overwhelm/OverwhelmMode";

import { ITask } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";
import { taskSync } from "@/lib/events/taskSync";

export function AppShell() {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [plannerSubTab, setPlannerSubTab] = useState<"daily" | "weekly">("daily");

  // Overwhelm Sanctuary Mode State
  const [isOverwhelmed, setIsOverwhelmed] = useState(false);
  const [allPendingTasks, setAllPendingTasks] = useState<ITask[]>([]);

  // Modal Controls
  const [isWhatNowOpen, setIsWhatNowOpen] = useState(false);
  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isDailyReviewOpen, setIsDailyReviewOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Selected Task for Modals
  const [focusTask, setFocusTask] = useState<ITask | null>(null);
  const [taskToReschedule, setTaskToReschedule] = useState<ITask | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<ITask | null>(null);
  const [defaultTaskDate, setDefaultTaskDate] = useState<string | null>(null);

  const { apiFetch } = useApi();

  // Load all tasks for dependency and overwhelm filtering
  async function loadTasksForShell() {
    const { data } = await apiFetch("/api/tasks");
    if (data?.tasks) {
      setAllPendingTasks(
        data.tasks.filter((t: any) => t.status !== "completed" && t.status !== "cancelled")
      );
    }
  }

  useEffect(() => {
    loadTasksForShell();
    const unsubscribe = taskSync.subscribe(() => {
      loadTasksForShell();
    });
    return unsubscribe;
  }, [currentTab]);

  useEffect(() => {
    if (!authLoading && !user && !firebaseUser) {
      setIsAuthOpen(true);
    }
  }, [authLoading, user, firebaseUser]);

  // Global Keyboard Shortcuts (N, B, T, P, F, Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setTaskToEdit(null);
        setIsNewTaskOpen(true);
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setIsBrainDumpOpen(true);
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setCurrentTab("dashboard");
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setCurrentTab("planner");
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsWhatNowOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleCommandAction(actionId: string) {
    if (actionId === "what_now") setIsWhatNowOpen(true);
    else if (actionId === "new_task") {
      setTaskToEdit(null);
      setIsNewTaskOpen(true);
    } else if (actionId === "brain_dump") setIsBrainDumpOpen(true);
    else if (actionId === "daily_review") setIsDailyReviewOpen(true);
    else if (actionId === "nav_dashboard") setCurrentTab("dashboard");
    else if (actionId === "nav_tasks") setCurrentTab("tasks");
    else if (actionId === "nav_planner") setCurrentTab("planner");
    else if (actionId === "nav_university") setCurrentTab("university");
    else if (actionId === "nav_learning") setCurrentTab("learning");
    else if (actionId === "nav_projects") setCurrentTab("projects");
    else if (actionId === "nav_goals") setCurrentTab("goals");
    else if (actionId === "nav_analytics") setCurrentTab("analytics");
    else if (actionId === "nav_settings") setCurrentTab("settings");
    else if (actionId === "toggle_palette") setIsPaletteOpen(true);
  }

  async function handleOverwhelmComplete(taskId: string) {
    await apiFetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    });
    toast.success("Task completed!");
    loadTasksForShell();
  }

  // If Overwhelm Mode is triggered, render the Sanctuary
  if (isOverwhelmed) {
    const criticalTasks = [...allPendingTasks].sort((a, b) => {
      const pOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (pOrder[b.priority] || 2) - (pOrder[a.priority] || 2);
    });

    return (
      <OverwhelmMode
        allPendingCount={allPendingTasks.length}
        criticalTasks={criticalTasks}
        onExit={() => setIsOverwhelmed(false)}
        onStartFocus={(task) => setFocusTask(task)}
        onCompleteTask={handleOverwhelmComplete}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground web-pattern-bg">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-28 md:pb-8">
        <Header
          onOpenCommandPalette={() => setIsPaletteOpen(true)}
          onOpenBrainDump={() => setIsBrainDumpOpen(true)}
          onTriggerWhatNow={() => setIsWhatNowOpen(true)}
          onToggleOverwhelm={() => setIsOverwhelmed(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === "dashboard" && (
            <CommandCenter
              onTriggerWhatShouldIDo={() => setIsWhatNowOpen(true)}
              onStartFocus={(task) => setFocusTask(task)}
              onOpenOverwhelm={() => setIsOverwhelmed(true)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === "tasks" && (
            <TasksView
              onStartFocus={(task) => setFocusTask(task)}
              onReschedule={(task) => setTaskToReschedule(task)}
              onOpenNewTask={() => {
                setTaskToEdit(null);
                setIsNewTaskOpen(true);
              }}
              onEditTask={(task) => {
                setTaskToEdit(task);
                setIsNewTaskOpen(true);
              }}
            />
          )}

          {currentTab === "planner" && (
            <div className="space-y-6">
              {/* Daily vs Weekly Toggle */}
              <div className="flex items-center justify-center gap-1.5 p-1 bg-secondary/40 border border-border/80 rounded-xl max-w-xs mx-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => setPlannerSubTab("daily")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    plannerSubTab === "daily"
                      ? "bg-primary text-white shadow-glow-crimson-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Daily Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setPlannerSubTab("weekly")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    plannerSubTab === "weekly"
                      ? "bg-primary text-white shadow-glow-crimson-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Weekly Planner
                </button>
              </div>

              {plannerSubTab === "daily" ? (
                <DailyPlannerView
                  onStartFocus={(task) => setFocusTask(task)}
                  onReschedule={(task) => setTaskToReschedule(task)}
                  onOpenNewTask={() => {
                    setTaskToEdit(null);
                    setDefaultTaskDate(null);
                    setIsNewTaskOpen(true);
                  }}
                />
              ) : (
                <WeeklyPlannerView
                  onStartFocus={(task) => setFocusTask(task)}
                  onOpenNewTask={(dateStr) => {
                    setTaskToEdit(null);
                    setDefaultTaskDate(dateStr || null);
                    setIsNewTaskOpen(true);
                  }}
                  onEditTask={(task) => {
                    setTaskToEdit(task);
                    setDefaultTaskDate(task.scheduledDate || null);
                    setIsNewTaskOpen(true);
                  }}
                />
              )}
            </div>
          )}

          {currentTab === "projects" && <ProjectsView />}
          {currentTab === "learning" && (
            <LearningRoadmapView
              onOpenNewTask={() => {
                setTaskToEdit(null);
                setIsNewTaskOpen(true);
              }}
            />
          )}
          {currentTab === "goals" && <GoalHierarchyView />}
          {currentTab === "university" && (
            <UniversityView
              onStartFocus={(task) => setFocusTask(task)}
              onOpenNewTask={() => {
                setTaskToEdit(null);
                setIsNewTaskOpen(true);
              }}
            />
          )}
          {currentTab === "analytics" && <AnalyticsView />}
          {currentTab === "review" && (
            <div className="max-w-md mx-auto pt-10 text-center space-y-4">
              <h2 className="text-xl font-bold text-foreground">Evening Closeout Review</h2>
              <p className="text-xs text-muted-foreground">
                Reflect on today's focus metrics, log mood, and carry over unfinished tasks.
              </p>
              <button
                onClick={() => setIsDailyReviewOpen(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary via-red-600 to-rose-600 hover:from-primary/90 hover:to-rose-500 text-white font-semibold text-xs shadow-glow-crimson transition-all"
              >
                Launch Daily Review
              </button>
            </div>
          )}
          {currentTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenQuickAdd={() => {
          setTaskToEdit(null);
          setIsNewTaskOpen(true);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Global Modals */}
      <WhatShouldIDoNowModal
        isOpen={isWhatNowOpen}
        onClose={() => setIsWhatNowOpen(false)}
        onStartFocus={(task) => setFocusTask(task)}
      />

      <FocusTimerModal
        task={focusTask}
        isOpen={Boolean(focusTask)}
        onClose={() => setFocusTask(null)}
        onSessionRecorded={loadTasksForShell}
      />

      <BrainDumpModal
        isOpen={isBrainDumpOpen}
        onClose={() => setIsBrainDumpOpen(false)}
        onSaved={loadTasksForShell}
      />

      <TaskModal
        isOpen={isNewTaskOpen}
        taskToEdit={taskToEdit}
        defaultDate={defaultTaskDate}
        existingTasks={allPendingTasks}
        onClose={() => {
          setIsNewTaskOpen(false);
          setTaskToEdit(null);
          setDefaultTaskDate(null);
        }}
        onSaved={loadTasksForShell}
      />

      <CarryOverModal
        task={taskToReschedule}
        isOpen={Boolean(taskToReschedule)}
        onClose={() => setTaskToReschedule(null)}
        onRescheduled={loadTasksForShell}
      />

      <DailyReviewModal
        isOpen={isDailyReviewOpen || currentTab === "review"}
        onClose={() => {
          setIsDailyReviewOpen(false);
          if (currentTab === "review") setCurrentTab("dashboard");
        }}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onAction={handleCommandAction}
      />
    </div>
  );
}
