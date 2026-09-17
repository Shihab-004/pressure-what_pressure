import { ITask } from "@/types";

export interface WorkloadStatus {
  totalPlannedMinutes: number;
  availableMinutes: number;
  overloadMinutes: number;
  isOverloaded: boolean;
  tasksCount: number;
  overloadPercentage: number;
}

/**
 * Calculates current planned minutes vs available work hours.
 */
export function calculateDailyWorkload(
  tasksForDay: ITask[],
  dailyWorkHours: number = 5.5
): WorkloadStatus {
  const activeTasks = tasksForDay.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled"
  );
  const totalPlannedMinutes = activeTasks.reduce(
    (acc, t) => acc + (t.estimatedMinutes || 45),
    0
  );
  const availableMinutes = Math.round(dailyWorkHours * 60);
  const overloadMinutes = Math.max(0, totalPlannedMinutes - availableMinutes);
  const isOverloaded = overloadMinutes > 0;
  const overloadPercentage =
    availableMinutes > 0
      ? Math.round((totalPlannedMinutes / availableMinutes) * 100)
      : 100;

  return {
    totalPlannedMinutes,
    availableMinutes,
    overloadMinutes,
    isOverloaded,
    tasksCount: activeTasks.length,
    overloadPercentage,
  };
}

export interface AutoBalanceResult {
  keptTasks: ITask[];
  rescheduledTasks: Array<{
    task: ITask;
    originalDate: string;
    newDate: string;
    reason: string;
  }>;
  balancedWorkloadMinutes: number;
}

/**
 * Auto-balances an overloaded day by intelligently postponing flexible, lower-priority tasks
 * to subsequent work days, while strictly preserving hard-deadline tasks.
 */
export function autoBalanceDay(
  tasksForDay: ITask[],
  targetDateStr: string, // YYYY-MM-DD
  dailyWorkHours: number = 5.5,
  workDays: number[] = [0, 1, 2, 3, 4]
): AutoBalanceResult {
  const availableMinutes = Math.round(dailyWorkHours * 60);
  const activeTasks = tasksForDay.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled"
  );

  // Categorize tasks:
  // Non-movable: Hard deadline is today or tomorrow, or critical priority
  const targetDate = new Date(targetDateStr);
  targetDate.setHours(23, 59, 59, 999);

  const hardDeadlineTasks: ITask[] = [];
  const flexibleTasks: ITask[] = [];

  activeTasks.forEach((t) => {
    let hasHardDeadlineToday = false;
    if (t.deadline) {
      const d = new Date(t.deadline);
      // If deadline is within 36 hours of targetDate, do NOT automatically move it!
      if (d.getTime() <= targetDate.getTime() + 36 * 60 * 60 * 1000) {
        hasHardDeadlineToday = true;
      }
    }

    if (t.priority === "critical" || hasHardDeadlineToday) {
      hardDeadlineTasks.push(t);
    } else {
      flexibleTasks.push(t);
    }
  });

  // Sort flexible tasks ascending by importance & urgency (lowest priority first to move out)
  const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
  flexibleTasks.sort((a, b) => {
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  const keptTasks: ITask[] = [...hardDeadlineTasks];
  let accumulatedMinutes = keptTasks.reduce(
    (acc, t) => acc + (t.estimatedMinutes || 45),
    0
  );

  const rescheduledTasks: AutoBalanceResult["rescheduledTasks"] = [];

  // Helper to find next valid work day
  function getNextWorkDate(current: string): string {
    const d = new Date(current);
    d.setDate(d.getDate() + 1);
    // Find next day matching user's workDays
    for (let i = 0; i < 7; i++) {
      if (workDays.includes(d.getDay())) {
        return d.toISOString().split("T")[0];
      }
      d.setDate(d.getDate() + 1);
    }
    return d.toISOString().split("T")[0];
  }

  const nextAvailableDate = getNextWorkDate(targetDateStr);

  // Fill up available hours with highest value flexible tasks
  // Reverse flexible tasks so we keep the most important ones
  const reversedFlexible = [...flexibleTasks].reverse();

  for (const task of reversedFlexible) {
    const taskMin = task.estimatedMinutes || 45;
    if (accumulatedMinutes + taskMin <= availableMinutes || keptTasks.length === 0) {
      keptTasks.push(task);
      accumulatedMinutes += taskMin;
    } else {
      rescheduledTasks.push({
        task,
        originalDate: targetDateStr,
        newDate: nextAvailableDate,
        reason: "Deferred to balance daily workload capacity",
      });
    }
  }

  return {
    keptTasks,
    rescheduledTasks,
    balancedWorkloadMinutes: accumulatedMinutes,
  };
}
