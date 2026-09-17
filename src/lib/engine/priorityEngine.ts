import { ITask } from "@/types";

export interface PriorityScoreBreakdown {
  totalScore: number;
  urgencyScore: number;
  importanceScore: number;
  overdueScore: number;
  dependencyScore: number;
  carryOverScore: number;
  goalScore: number;
  reasons: string[];
}

/**
 * Calculates a deterministic dynamic priority score for a task.
 * Higher score = higher urgency & priority.
 */
export function calculateDynamicPriority(
  task: ITask,
  allTasks: ITask[] = [],
  availableMinutesToday?: number
): PriorityScoreBreakdown {
  const reasons: string[] = [];
  let urgencyScore = 0;
  let importanceScore = 0;
  let overdueScore = 0;
  let dependencyScore = 0;
  let carryOverScore = 0;
  let goalScore = 0;

  // 1. Base Importance / Stated Priority
  switch (task.priority) {
    case "critical":
      importanceScore = 40;
      reasons.push("Marked as Critical priority");
      break;
    case "high":
      importanceScore = 25;
      reasons.push("High priority task");
      break;
    case "medium":
      importanceScore = 15;
      break;
    case "low":
      importanceScore = 5;
      break;
    default:
      importanceScore = 10;
  }

  // 2. Deadline Urgency & Overdue State
  if (task.deadline) {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      // Overdue
      const daysOverdue = Math.abs(Math.floor(diffHours / 24));
      overdueScore = 50 + Math.min(daysOverdue * 5, 30);
      reasons.push(
        daysOverdue === 0
          ? "Overdue today"
          : `Overdue by ${daysOverdue} day${daysOverdue > 1 ? "s" : ""}`
      );
    } else if (diffHours <= 12) {
      urgencyScore = 45;
      reasons.push("Deadline is within 12 hours");
    } else if (diffHours <= 24) {
      urgencyScore = 35;
      reasons.push("Deadline is tomorrow");
    } else if (diffHours <= 48) {
      urgencyScore = 25;
      reasons.push("Deadline is within 2 days");
    } else if (diffHours <= 7 * 24) {
      urgencyScore = 15;
      reasons.push("Due this week");
    } else {
      urgencyScore = 5;
    }
  }

  // 3. Dependency Factor: Unblocks other pending tasks?
  if (allTasks.length > 0) {
    const dependentCount = allTasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.status !== "cancelled" &&
        t.dependencies &&
        t.dependencies.includes(task._id)
    ).length;

    if (dependentCount > 0) {
      dependencyScore = Math.min(dependentCount * 12, 36);
      reasons.push(`Prerequisite for ${dependentCount} other task${dependentCount > 1 ? "s" : ""}`);
    }
  }

  // 4. Carry-Over Factor: Postponed repeatedly?
  if (task.carryOverCount && task.carryOverCount > 0) {
    carryOverScore = Math.min(task.carryOverCount * 6, 24);
    reasons.push(`Carried over ${task.carryOverCount} time${task.carryOverCount > 1 ? "s" : ""}`);
  }

  // 5. Goal Relevance
  if (task.goalId) {
    goalScore = 10;
    reasons.push("Directly advances an active goal");
  }

  // 6. Time Fit
  if (
    availableMinutesToday !== undefined &&
    availableMinutesToday > 0 &&
    task.estimatedMinutes
  ) {
    if (task.estimatedMinutes <= availableMinutesToday) {
      reasons.push(`Fits today's remaining time (${task.estimatedMinutes}m)`);
    }
  }

  const totalScore =
    urgencyScore +
    importanceScore +
    overdueScore +
    dependencyScore +
    carryOverScore +
    goalScore;

  return {
    totalScore,
    urgencyScore,
    importanceScore,
    overdueScore,
    dependencyScore,
    carryOverScore,
    goalScore,
    reasons,
  };
}
