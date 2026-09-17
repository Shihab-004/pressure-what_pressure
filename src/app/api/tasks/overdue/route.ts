import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/models/Task";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const now = new Date();

    const overdueTasks = await Task.find({
      userId: authUser.id,
      status: { $nin: ["completed", "cancelled"] },
      deadline: { $lt: now },
    })
      .sort({ deadline: 1 })
      .lean();

    const important: any[] = [];
    const lowPriority: any[] = [];
    const inactive14Days: any[] = [];

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    overdueTasks.forEach((task: any) => {
      const updatedAt = new Date(task.updatedAt);
      const isInactive = updatedAt.getTime() < fourteenDaysAgo.getTime();

      if (isInactive) {
        inactive14Days.push(task);
      } else if (task.priority === "critical" || task.priority === "high") {
        important.push(task);
      } else {
        lowPriority.push(task);
      }
    });

    return NextResponse.json({
      totalCount: overdueTasks.length,
      important,
      lowPriority,
      inactive14Days,
      allOverdue: overdueTasks,
    });
  } catch (err: any) {
    console.error("GET /api/tasks/overdue error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch overdue tasks" },
      { status: 500 }
    );
  }
}
