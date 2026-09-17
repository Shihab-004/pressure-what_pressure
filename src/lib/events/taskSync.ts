"use client";

type TaskSyncEventType =
  | "task:created"
  | "task:updated"
  | "task:deleted"
  | "task:rescheduled"
  | "task:completed"
  | "workspace:reset"
  | "workspace:refresh";

export interface TaskSyncEvent {
  type: TaskSyncEventType;
  taskId?: string;
  data?: any;
}

type TaskSyncCallback = (event?: TaskSyncEvent) => void;

class TaskSyncBus {
  private listeners = new Set<TaskSyncCallback>();

  /**
   * Subscribe to task and schedule mutations across all views.
   * Returns an unsubscribe cleanup function.
   */
  subscribe(callback: TaskSyncCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all active views (Tasks, Daily Planner, Weekly Planner, CommandCenter, etc.)
   * to immediately synchronize without a manual page refresh.
   */
  notify(event: TaskSyncEvent = { type: "workspace:refresh" }) {
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error("TaskSync listener error:", err);
      }
    });
  }
}

export const taskSync = new TaskSyncBus();
