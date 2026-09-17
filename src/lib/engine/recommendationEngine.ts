import { ITask, ITaskRecommendation } from "@/types";
import { calculateDynamicPriority } from "./priorityEngine";

/**
 * Determines if a task is blocked by unfinished prerequisite dependencies.
 */
export function isTaskBlocked(task: ITask, allTasks: ITask[]): boolean {
  if (!task.dependencies || task.dependencies.length === 0) {
    return false;
  }

  const completedTaskIds = new Set(
    allTasks.filter((t) => t.status === "completed").map((t) => t._id.toString())
  );

  // If any prerequisite is not completed, this task is blocked!
  return task.dependencies.some((depId) => !completedTaskIds.has(depId.toString()));
}

/**
 * Signature Feature: "What Should I Do Now?"
 * Evaluates all pending tasks and selects the optimal next action with transparent justification.
 */
export function recommendNextTask(
  tasks: ITask[],
  availableMinutesToday?: number
): ITaskRecommendation | null {
  // Only evaluate actionable tasks
  const candidateTasks = tasks.filter((t) => {
    if (t.status === "completed" || t.status === "cancelled") return false;
    // Must NOT be blocked by dependencies
    if (isTaskBlocked(t, tasks)) return false;
    return true;
  });

  if (candidateTasks.length === 0) {
    return null;
  }

  // Score each eligible task
  const scoredTasks = candidateTasks.map((task) => {
    const breakdown = calculateDynamicPriority(task, tasks, availableMinutesToday);
    return {
      task,
      breakdown,
      score: breakdown.totalScore,
    };
  });

  // Sort descending by score
  scoredTasks.sort((a, b) => b.score - a.score);

  const best = scoredTasks[0];
  const alternatives = scoredTasks.slice(1, 4).map((item) => item.task);

  // Construct clear, user-friendly justification points
  const reasons = [...best.breakdown.reasons];
  if (reasons.length === 0) {
    reasons.push("Ready for execution", `Estimated ${best.task.estimatedMinutes || 45} minutes`);
  }

  return {
    task: best.task,
    reasons,
    score: best.score,
    alternativeTasks: alternatives,
  };
}
