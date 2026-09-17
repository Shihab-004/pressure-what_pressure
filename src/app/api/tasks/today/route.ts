import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/models/Task";
import { calculateDynamicPriority } from "@/lib/engine/priorityEngine";
import { calculateDailyWorkload } from "@/lib/engine/workloadBalancer";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const todayStr = new Date().toISOString().split("T")[0];

    // Query tasks scheduled for today or explicitly marked today/in_progress
    const tasks = await Task.find({
      userId: authUser.id,
      $or: [
        { scheduledDate: todayStr },
        { status: { $in: ["today", "in_progress"] } },
      ],
      status: { $nin: ["cancelled"] },
    }).lean();

    const allUserTasks = await Task.find({
      userId: authUser.id,
      status: { $nin: ["completed", "cancelled"] },
    }).lean();

    const mappedTasks = tasks.map((t: any) => {
      const taskObj = { ...t, _id: t._id.toString() };
      const breakdown = calculateDynamicPriority(taskObj as any, allUserTasks as any);
      return {
        ...taskObj,
        dynamicScore: breakdown.totalScore,
        priorityReasons: breakdown.reasons,
      };
    });

    // Sort by dynamic score descending
    mappedTasks.sort((a, b) => b.dynamicScore - a.dynamicScore);

    // Group into DO FIRST, NEXT, THEN, OPTIONAL
    const activeTasks = mappedTasks.filter((t) => t.status !== "completed");
    const completedTasks = mappedTasks.filter((t) => t.status === "completed");

    let doFirst = activeTasks.length > 0 ? activeTasks[0] : null;
    let nextTask = activeTasks.length > 1 ? activeTasks[1] : null;
    let thenTask = activeTasks.length > 2 ? activeTasks[2] : null;
    let optionalTasks = activeTasks.length > 3 ? activeTasks.slice(3) : [];

    // Workload calculation
    const dailyWorkHours = authUser.preferences?.dailyWorkHours || 5.5;
    const workload = calculateDailyWorkload(mappedTasks as any, dailyWorkHours);

    return NextResponse.json({
      todayDate: todayStr,
      workload,
      doFirst,
      nextTask,
      thenTask,
      optionalTasks,
      completedTasks,
      totalCount: mappedTasks.length,
    });
  } catch (err: any) {
    console.error("GET /api/tasks/today error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch today's tasks" }, { status: 500 });
  }
}
