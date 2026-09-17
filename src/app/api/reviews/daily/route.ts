import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { DailyReview } from "@/models/DailyReview";
import { Task } from "@/models/Task";
import { FocusSession } from "@/models/FocusSession";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const review = await DailyReview.findOne({ userId: authUser.id, date }).lean();

    // Compute today's auto-stats
    const completedCount = await Task.countDocuments({
      userId: authUser.id,
      scheduledDate: date,
      status: "completed",
    });

    const missedCount = await Task.countDocuments({
      userId: authUser.id,
      scheduledDate: date,
      status: { $in: ["planned", "today", "inbox"] },
    });

    // Sum focus sessions today
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const sessions = await FocusSession.find({
      userId: authUser.id,
      startedAt: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    const focusTimeMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    return NextResponse.json({
      date,
      existingReview: review,
      stats: {
        completedCount,
        missedCount,
        focusTimeMinutes,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch daily review" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    const date = body.date || new Date().toISOString().split("T")[0];

    await connectToDatabase();

    const review = await DailyReview.findOneAndUpdate(
      { userId: authUser.id, date },
      {
        $set: {
          completedCount: body.completedCount,
          missedCount: body.missedCount,
          focusTimeMinutes: body.focusTimeMinutes,
          mood: body.mood || "normal",
          notes: body.notes || "",
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ review });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save daily review" }, { status: 400 });
  }
}
