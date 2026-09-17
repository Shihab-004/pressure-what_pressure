import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/models/Task";
import { calculateDailyWorkload } from "@/lib/engine/workloadBalancer";
import { calculateDynamicPriority } from "@/lib/engine/priorityEngine";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const tasks = await Task.find({
      userId: authUser.id,
      scheduledDate: date,
      status: { $nin: ["cancelled"] },
    }).lean();

    const allActive = await Task.find({
      userId: authUser.id,
      status: { $nin: ["completed", "cancelled"] },
    }).lean();

    const mappedTasks = tasks.map((t: any) => {
      const taskObj = { ...t, _id: t._id.toString() };
      const scoreData = calculateDynamicPriority(taskObj as any, allActive as any);
      return {
        ...taskObj,
        dynamicScore: scoreData.totalScore,
        priorityReasons: scoreData.reasons,
      };
    });

    mappedTasks.sort((a, b) => b.dynamicScore - a.dynamicScore);

    // Build timeline blocks starting at 09:00 AM
    let currentHour = 9;
    let currentMinute = 0;

    const timeline = mappedTasks.map((t) => {
      const startH = String(currentHour).padStart(2, "0");
      const startM = String(currentMinute).padStart(2, "0");
      const duration = t.estimatedMinutes || 45;

      const totalEndMinutes = currentHour * 60 + currentMinute + duration;
      const endH = String(Math.floor(totalEndMinutes / 60)).padStart(2, "0");
      const endM = String(totalEndMinutes % 60).padStart(2, "0");

      // Advance by task duration + 15 min buffer
      const nextTotal = totalEndMinutes + 15;
      currentHour = Math.floor(nextTotal / 60);
      currentMinute = nextTotal % 60;

      return {
        ...t,
        timeSlot: `${startH}:${startM} – ${endH}:${endM}`,
      };
    });

    const dailyWorkHours = authUser.preferences?.dailyWorkHours || 5.5;
    const workload = calculateDailyWorkload(mappedTasks as any, dailyWorkHours);

    return NextResponse.json({
      date,
      workload,
      tasks: timeline,
    });
  } catch (err: any) {
    console.error("GET /api/planner/daily error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch daily plan" }, { status: 500 });
  }
}
