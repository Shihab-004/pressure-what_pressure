import { ITask } from "@/types";

export interface DurationBucketStats {
  count: number;
  totalEstimated: number;
  totalActual: number;
  averageDiffPercentage: number; // e.g. +25% means took 25% longer than planned
}

export interface EstimationIntelligenceReport {
  overallBiasPercentage: number;
  under30Min: DurationBucketStats;
  between30And60Min: DurationBucketStats;
  over60Min: DurationBucketStats;
  insights: string[];
}

/**
 * Evaluates historical task completion data to detect estimation biases and produce factual planning advice.
 */
export function analyzeEstimationPatterns(tasks: ITask[]): EstimationIntelligenceReport {
  const completedTasksWithTimes = tasks.filter(
    (t) =>
      t.status === "completed" &&
      t.estimatedMinutes &&
      t.estimatedMinutes > 0 &&
      t.actualMinutes &&
      t.actualMinutes > 0
  );

  const under30: ITask[] = [];
  const mid30to60: ITask[] = [];
  const over60: ITask[] = [];

  for (const t of completedTasksWithTimes) {
    const est = t.estimatedMinutes!;
    if (est < 30) {
      under30.push(t);
    } else if (est <= 60) {
      mid30to60.push(t);
    } else {
      over60.push(t);
    }
  }

  function computeBucket(bucketTasks: ITask[]): DurationBucketStats {
    if (bucketTasks.length === 0) {
      return { count: 0, totalEstimated: 0, totalActual: 0, averageDiffPercentage: 0 };
    }
    const totalEst = bucketTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
    const totalAct = bucketTasks.reduce((acc, t) => acc + (t.actualMinutes || 0), 0);
    const diffPct = totalEst > 0 ? Math.round(((totalAct - totalEst) / totalEst) * 100) : 0;
    return {
      count: bucketTasks.length,
      totalEstimated: totalEst,
      totalActual: totalAct,
      averageDiffPercentage: diffPct,
    };
  }

  const bUnder30 = computeBucket(under30);
  const bMid = computeBucket(mid30to60);
  const bOver60 = computeBucket(over60);

  const totalAllEst = completedTasksWithTimes.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const totalAllAct = completedTasksWithTimes.reduce((acc, t) => acc + (t.actualMinutes || 0), 0);
  const overallBias = totalAllEst > 0 ? Math.round(((totalAllAct - totalAllEst) / totalAllEst) * 100) : 0;

  const insights: string[] = [];

  if (completedTasksWithTimes.length < 3) {
    insights.push("More completed focus sessions will unlock tailored estimation pattern insights.");
  } else {
    if (bOver60.count >= 2 && bOver60.averageDiffPercentage > 15) {
      insights.push(
        `Tasks estimated over 60 minutes typically take ${bOver60.averageDiffPercentage}% longer than planned. Consider breaking them into smaller 45m blocks.`
      );
    }
    if (bMid.count >= 2 && Math.abs(bMid.averageDiffPercentage) <= 10) {
      insights.push("Your 30–60 minute task estimates are remarkably accurate (within ±10%).");
    } else if (bMid.count >= 2 && bMid.averageDiffPercentage > 15) {
      insights.push(`Medium tasks (30–60m) average +${bMid.averageDiffPercentage}% beyond initial estimates.`);
    }
    if (overallBias > 15) {
      insights.push(`Across all work, tasks tend to take +${overallBias}% longer than anticipated.`);
    } else if (overallBias < -10) {
      insights.push(`You are completing tasks faster than your estimates by ${Math.abs(overallBias)}%.`);
    }
  }

  return {
    overallBiasPercentage: overallBias,
    under30Min: bUnder30,
    between30And60Min: bMid,
    over60Min: bOver60,
    insights,
  };
}
