import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/models/Task";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import { addDays, format, startOfWeek } from "date-fns";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    const baseDate = dateParam ? new Date(dateParam) : new Date();
    // Week sequence starts on Friday (5): Fri, Sat, Sun, Mon, Tue, Wed, Thu
    const weekStartObj = startOfWeek(baseDate, { weekStartsOn: 5 });
    const weekStartStr = format(weekStartObj, "yyyy-MM-dd");
    const weekEndStr = format(addDays(weekStartObj, 6), "yyyy-MM-dd");

    // Fetch tasks scheduled within this 7-day range
    const tasks = await Task.find({
      userId: authUser.id,
      scheduledDate: { $gte: weekStartStr, $lte: weekEndStr },
      status: { $nin: ["cancelled"] },
    }).lean();

    // Group tasks by day
    const daysMap: Record<string, any[]> = {};
    for (let i = 0; i < 7; i++) {
      const dayStr = format(addDays(weekStartObj, i), "yyyy-MM-dd");
      daysMap[dayStr] = [];
    }

    tasks.forEach((t: any) => {
      if (t.scheduledDate && daysMap[t.scheduledDate]) {
        daysMap[t.scheduledDate].push({ ...t, _id: t._id.toString() });
      }
    });

    // Also get or check WeeklyPlan
    const plan = await WeeklyPlan.findOne({
      userId: authUser.id,
      weekStart: weekStartStr,
    }).lean();

    return NextResponse.json({
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      days: daysMap,
      planNotes: plan?.notes || "",
    });
  } catch (err: any) {
    console.error("GET /api/planner/weekly error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch weekly plan" }, { status: 500 });
  }
}

/**
 * "BUILD MY WEEK": Automatically distributes unassigned active tasks across the week
 */
export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const body = await req.json();
    const weekStartStr = body.weekStart || format(startOfWeek(new Date(), { weekStartsOn: 5 }), "yyyy-MM-dd");
    const weekStartObj = new Date(weekStartStr);

    const workDays = authUser.preferences?.workDays || [0, 1, 2, 3, 4];
    const dailyCapMinutes = (authUser.preferences?.dailyWorkHours || 5.5) * 60;

    // Available target dates this week that match user workDays
    const targetDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = addDays(weekStartObj, i);
      if (workDays.includes(currentDay.getDay())) {
        targetDates.push(format(currentDay, "yyyy-MM-dd"));
      }
    }

    if (targetDates.length === 0) {
      targetDates.push(weekStartStr);
    }

    // Find active unassigned tasks (inbox, planned, without scheduledDate or scheduled in the past)
    const pendingTasks = await Task.find({
      userId: authUser.id,
      status: { $in: ["inbox", "planned"] },
      scheduledDate: { $in: [null, ""] },
    })
      .sort({ priority: -1, createdAt: 1 })
      .limit(20);

    let dayIndex = 0;
    const assignedCounts: Record<string, number> = {};
    targetDates.forEach((d) => (assignedCounts[d] = 0));

    const scheduledUpdates = [];

    for (const task of pendingTasks) {
      const assignedDate = targetDates[dayIndex % targetDates.length];
      task.scheduledDate = assignedDate;
      task.status = "planned";
      await task.save();

      assignedCounts[assignedDate] = (assignedCounts[assignedDate] || 0) + 1;
      scheduledUpdates.push({ taskId: task._id.toString(), title: task.title, date: assignedDate });
      dayIndex++;
    }

    return NextResponse.json({
      success: true,
      message: `Distributed ${pendingTasks.length} tasks across ${targetDates.length} working days.`,
      scheduledUpdates,
    });
  } catch (err: any) {
    console.error("POST /api/planner/weekly error:", err);
    return NextResponse.json({ error: err.message || "Failed to build weekly plan" }, { status: 500 });
  }
}
