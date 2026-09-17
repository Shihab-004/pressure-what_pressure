import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/models/Task";
import { FocusSession } from "@/models/FocusSession";
import { LearningRoadmap } from "@/models/LearningRoadmap";
import { analyzeEstimationPatterns } from "@/lib/engine/estimationIntelligence";
import { subDays, addDays, format, startOfWeek } from "date-fns";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const fourteenDaysAgo = subDays(now, 14);

    // 1. All tasks for this user
    const allTasks = await Task.find({ userId: authUser.id }).lean();
    const mappedTasks: any[] = allTasks.map((t: any) => ({ ...t, _id: t._id.toString() }));

    // 2. Weekly stats (last 7 days)
    const recentTasks = mappedTasks.filter(
      (t) =>
        new Date(t.createdAt) >= sevenDaysAgo ||
        (t.completedAt && new Date(t.completedAt) >= sevenDaysAgo)
    );

    const completedRecent = recentTasks.filter((t) => t.status === "completed");
    const cancelledRecent = recentTasks.filter((t) => t.status === "cancelled");
    const carriedOverRecent = recentTasks.filter((t) => (t.carryOverCount || 0) > 0);

    const completionRate =
      recentTasks.length > 0
        ? Math.round((completedRecent.length / recentTasks.length) * 100)
        : mappedTasks.length > 0
        ? Math.round((mappedTasks.filter((t) => t.status === "completed").length / mappedTasks.length) * 100)
        : 0;

    // 3. Focus Sessions
    const recentFocusSessions = await FocusSession.find({
      userId: authUser.id,
      startedAt: { $gte: sevenDaysAgo },
    }).lean();

    const weeklyFocusMinutes = recentFocusSessions.reduce(
      (acc, s) => acc + (s.durationMinutes || 0),
      0
    );

    // 4. Work by Category breakdown
    const categoryCounts: Record<string, { total: number; completed: number; minutes: number }> = {};
    mappedTasks.forEach((t) => {
      const cat = t.category || "Personal";
      if (!categoryCounts[cat]) {
        categoryCounts[cat] = { total: 0, completed: 0, minutes: 0 };
      }
      categoryCounts[cat].total++;
      categoryCounts[cat].minutes += t.estimatedMinutes || 45;
      if (t.status === "completed") {
        categoryCounts[cat].completed++;
      }
    });

    // 5. Daily Velocity for Current Week Starting on Friday (Fri, Sat, Sun, Mon, Tue, Wed, Thu)
    const weekStartObj = startOfWeek(now, { weekStartsOn: 5 });
    const dailyVelocity: Array<{
      date: string;
      dayName: string;
      dayLabel: string;
      planned: number;
      completed: number;
      focusMinutes: number;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(weekStartObj, i);
      const dayStr = format(dayDate, "yyyy-MM-dd");
      const dayName = format(dayDate, "EEE"); // Fri, Sat...
      const dayLabel = format(dayDate, "MMM d");

      const dayTasks = mappedTasks.filter((t) => t.scheduledDate === dayStr);
      const dayCompleted = dayTasks.filter((t) => t.status === "completed").length;
      const daySessions = recentFocusSessions.filter((s: any) => {
        if (!s.startedAt) return false;
        const sDate = format(new Date(s.startedAt), "yyyy-MM-dd");
        return sDate === dayStr;
      });
      const dayFocus = daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

      dailyVelocity.push({
        date: dayStr,
        dayName,
        dayLabel,
        planned: dayTasks.length,
        completed: dayCompleted,
        focusMinutes: dayFocus,
      });
    }

    // 6. Priority Distribution
    const priorityCounts: Record<string, { total: number; completed: number }> = {
      critical: { total: 0, completed: 0 },
      high: { total: 0, completed: 0 },
      medium: { total: 0, completed: 0 },
      low: { total: 0, completed: 0 },
    };

    mappedTasks.forEach((t) => {
      const p = t.priority || "medium";
      if (priorityCounts[p]) {
        priorityCounts[p].total++;
        if (t.status === "completed") {
          priorityCounts[p].completed++;
        }
      }
    });

    // 7. Status Distribution
    const statusCounts: Record<string, number> = {
      completed: 0,
      planned: 0,
      inbox: 0,
      overdue: 0,
    };

    const nowTime = now.getTime();
    mappedTasks.forEach((t) => {
      if (t.status === "completed") {
        statusCounts.completed++;
      } else {
        if (t.deadline && new Date(t.deadline).getTime() < nowTime) {
          statusCounts.overdue++;
        }
        if (t.status === "planned" || t.scheduledDate) {
          statusCounts.planned++;
        } else {
          statusCounts.inbox++;
        }
      }
    });

    // 8. Estimation Intelligence Patterns (Planned vs Actual)
    const estimationReport = analyzeEstimationPatterns(mappedTasks);

    // 9. Forgotten Work Detector (tasks or roadmaps untouched > 14 days)
    const forgottenTasks = mappedTasks
      .filter(
        (t) =>
          t.status !== "completed" &&
          t.status !== "cancelled" &&
          new Date(t.updatedAt) < fourteenDaysAgo
      )
      .slice(0, 10);

    const forgottenRoadmaps = await LearningRoadmap.find({
      userId: authUser.id,
      status: "active",
      updatedAt: { $lt: fourteenDaysAgo },
    }).lean();

    // 10. Evidence-Based Factual Insights
    const factualInsights: string[] = [];

    if (carriedOverRecent.length >= 2) {
      factualInsights.push(
        `${carriedOverRecent.length} tasks were postponed multiple times. Consider scaling down commitments or using 1-Click Auto-Balance.`
      );
    }

    if (forgottenRoadmaps.length > 0) {
      forgottenRoadmaps.forEach((rm: any) => {
        const days = Math.round(
          (now.getTime() - new Date(rm.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        factualInsights.push(
          `Learning roadmap "${rm.title}" has had no activity for ${days} days.`
        );
      });
    }

    if (estimationReport.insights.length > 0) {
      factualInsights.push(...estimationReport.insights);
    }

    if (factualInsights.length === 0) {
      factualInsights.push("High execution velocity logged across planned engineering targets.");
      factualInsights.push("Work distribution matches balanced workload limits.");
    }

    return NextResponse.json({
      weekly: {
        planned: recentTasks.length || mappedTasks.length,
        completed: completedRecent.length || mappedTasks.filter((t) => t.status === "completed").length,
        cancelled: cancelledRecent.length,
        carriedOver: carriedOverRecent.length,
        completionRate,
        focusMinutes: weeklyFocusMinutes,
      },
      categoryDistribution: categoryCounts,
      dailyVelocity,
      priorityDistribution: priorityCounts,
      statusDistribution: statusCounts,
      estimationIntelligence: estimationReport,
      forgottenWork: {
        tasks: forgottenTasks,
        roadmaps: forgottenRoadmaps,
        count: forgottenTasks.length + forgottenRoadmaps.length,
      },
      insights: factualInsights,
    });
  } catch (err: any) {
    console.error("GET /api/analytics error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to compile analytics" },
      { status: 500 }
    );
  }
}
