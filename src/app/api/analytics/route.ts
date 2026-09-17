import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/models/Task";
import { FocusSession } from "@/models/FocusSession";
import { LearningRoadmap } from "@/models/LearningRoadmap";
import { analyzeEstimationPatterns } from "@/lib/engine/estimationIntelligence";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const fourteenDaysAgo = subDays(now, 14);
    const thirtyDaysAgo = subDays(now, 30);

    // 1. All tasks for this user
    const allTasks = await Task.find({ userId: authUser.id }).lean();
    const mappedTasks: any[] = allTasks.map((t: any) => ({ ...t, _id: t._id.toString() }));

    // 2. Weekly stats (last 7 days)
    const recentTasks = mappedTasks.filter(
      (t) => new Date(t.createdAt) >= sevenDaysAgo || (t.completedAt && new Date(t.completedAt) >= sevenDaysAgo)
    );

    const completedRecent = recentTasks.filter((t) => t.status === "completed");
    const cancelledRecent = recentTasks.filter((t) => t.status === "cancelled");
    const carriedOverRecent = recentTasks.filter((t) => (t.carryOverCount || 0) > 0);

    const completionRate =
      recentTasks.length > 0 ? Math.round((completedRecent.length / recentTasks.length) * 100) : 0;

    // 3. Focus Sessions (last 7 days and last 30 days)
    const recentFocusSessions = await FocusSession.find({
      userId: authUser.id,
      startedAt: { $gte: sevenDaysAgo },
    }).lean();

    const weeklyFocusMinutes = recentFocusSessions.reduce(
      (acc, s) => acc + (s.durationMinutes || 0),
      0
    );

    // 4. Work by Category breakdown
    const categoryCounts: Record<string, { total: number; completed: number }> = {};
    mappedTasks.forEach((t) => {
      const cat = t.category || "Personal";
      if (!categoryCounts[cat]) {
        categoryCounts[cat] = { total: 0, completed: 0 };
      }
      categoryCounts[cat].total++;
      if (t.status === "completed") {
        categoryCounts[cat].completed++;
      }
    });

    // 5. Estimation Intelligence Patterns (Planned vs Actual)
    const estimationReport = analyzeEstimationPatterns(mappedTasks);

    // 6. Forgotten Work Detector (tasks or roadmaps untouched > 14 days)
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

    // 7. Evidence-Based Factual Insights
    const factualInsights: string[] = [];

    if (carriedOverRecent.length >= 3) {
      factualInsights.push(
        `${carriedOverRecent.length} tasks were postponed multiple times this week. Review priority or scale down commitments.`
      );
    }

    if (forgottenRoadmaps.length > 0) {
      forgottenRoadmaps.forEach((rm: any) => {
        const days = Math.round((now.getTime() - new Date(rm.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        factualInsights.push(`Learning roadmap "${rm.title}" has had no activity for ${days} days.`);
      });
    }

    if (estimationReport.insights.length > 0) {
      factualInsights.push(...estimationReport.insights);
    }

    return NextResponse.json({
      weekly: {
        planned: recentTasks.length,
        completed: completedRecent.length,
        cancelled: cancelledRecent.length,
        carriedOver: carriedOverRecent.length,
        completionRate,
        focusMinutes: weeklyFocusMinutes,
      },
      categoryDistribution: categoryCounts,
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
    return NextResponse.json({ error: err.message || "Failed to compile analytics" }, { status: 500 });
  }
}
