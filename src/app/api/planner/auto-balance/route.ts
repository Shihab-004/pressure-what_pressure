import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/models/Task";
import { autoBalanceDay } from "@/lib/engine/workloadBalancer";

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    const date = body.date || new Date().toISOString().split("T")[0];

    await connectToDatabase();

    const tasks = await Task.find({
      userId: authUser.id,
      scheduledDate: date,
      status: { $nin: ["completed", "cancelled"] },
    }).lean();

    const mappedTasks: any = tasks.map((t: any) => ({
      ...t,
      _id: t._id.toString(),
    }));

    const dailyWorkHours = authUser.preferences?.dailyWorkHours || 5.5;
    const workDays = authUser.preferences?.workDays || [0, 1, 2, 3, 4];

    const result = autoBalanceDay(mappedTasks, date, dailyWorkHours, workDays);

    // Apply rescheduled changes in MongoDB
    for (const item of result.rescheduledTasks) {
      await Task.updateOne(
        { _id: item.task._id, userId: authUser.id },
        {
          $set: {
            scheduledDate: item.newDate,
            carryOverReason: "not_enough_time",
          },
          $inc: { carryOverCount: 1 },
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Balanced workload: kept ${result.keptTasks.length} tasks, shifted ${result.rescheduledTasks.length} tasks to avoid burnout.`,
      result,
    });
  } catch (err: any) {
    console.error("POST /api/planner/auto-balance error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to auto-balance day" },
      { status: 500 }
    );
  }
}
