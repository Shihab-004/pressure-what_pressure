import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/models/Task";
import { recommendNextTask } from "@/lib/engine/recommendationEngine";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const availableMinutesStr = searchParams.get("availableMinutes");
    const availableMinutes = availableMinutesStr ? parseInt(availableMinutesStr, 10) : undefined;

    // Fetch all active tasks belonging to this user
    const tasks = await Task.find({
      userId: authUser.id,
      status: { $nin: ["completed", "cancelled"] },
    }).lean();

    const tasksMapped: any = tasks.map((t: any) => ({
      ...t,
      _id: t._id.toString(),
      dependencies: (t.dependencies || []).map((d: any) => d.toString()),
    }));

    const recommendation = recommendNextTask(tasksMapped, availableMinutes);

    return NextResponse.json({ recommendation });
  } catch (err: any) {
    console.error("Recommendation engine error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to calculate recommendation" },
      { status: 500 }
    );
  }
}
