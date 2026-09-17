import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/models/Task";
import { Project } from "@/models/Project";
import { Goal } from "@/models/Goal";
import { Course } from "@/models/Course";
import { LearningRoadmap } from "@/models/LearningRoadmap";
import { FocusSession } from "@/models/FocusSession";
import { DailyReview } from "@/models/DailyReview";
import { WeeklyPlan } from "@/models/WeeklyPlan";

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json().catch(() => ({}));
    if (body.confirmation !== "RESET") {
      return NextResponse.json(
        { error: 'Explicit confirmation required. Please provide confirmation: "RESET"' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const userId = authUser.id;

    const [tasksRes, projectsRes, goalsRes, coursesRes, roadmapsRes, sessionsRes, reviewsRes, plansRes] =
      await Promise.all([
        Task.deleteMany({ userId }),
        Project.deleteMany({ userId }),
        Goal.deleteMany({ userId }),
        Course.deleteMany({ userId }),
        LearningRoadmap.deleteMany({ userId }),
        FocusSession.deleteMany({ userId }),
        DailyReview.deleteMany({ userId }),
        WeeklyPlan.deleteMany({ userId }),
      ]);

    return NextResponse.json({
      success: true,
      message: "Workspace successfully reset. All tasks, projects, and plans have been cleared.",
      stats: {
        tasksDeleted: tasksRes.deletedCount,
        projectsDeleted: projectsRes.deletedCount,
        goalsDeleted: goalsRes.deletedCount,
        coursesDeleted: coursesRes.deletedCount,
        roadmapsDeleted: roadmapsRes.deletedCount,
        sessionsDeleted: sessionsRes.deletedCount,
        reviewsDeleted: reviewsRes.deletedCount,
        plansDeleted: plansRes.deletedCount,
      },
    });
  } catch (err: any) {
    console.error("POST /api/workspace/reset error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to reset workspace" },
      { status: 500 }
    );
  }
}
