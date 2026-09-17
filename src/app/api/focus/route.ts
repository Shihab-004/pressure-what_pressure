import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { FocusSession } from "@/models/FocusSession";
import { Task } from "@/models/Task";
import { z } from "zod";

const RecordSessionSchema = z.object({
  taskId: z.string().min(1, "TaskId is required"),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  durationMinutes: z.number().min(0),
  completed: z.boolean().default(false),
  interruptions: z.number().min(0).default(0),
  notes: z.string().optional().default(""),
});

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const sessions = await FocusSession.find({ userId: authUser.id })
      .sort({ startedAt: -1 })
      .limit(50)
      .populate("taskId", "title category")
      .lean();

    return NextResponse.json({ sessions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch focus sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = RecordSessionSchema.parse(body);

    await connectToDatabase();

    const session = await FocusSession.create({
      userId: authUser.id,
      taskId: validated.taskId,
      startedAt: new Date(validated.startedAt),
      endedAt: validated.endedAt ? new Date(validated.endedAt) : new Date(),
      durationMinutes: validated.durationMinutes,
      completed: validated.completed,
      interruptions: validated.interruptions,
      notes: validated.notes,
    });

    // Update the task actualMinutes and status if completed
    const taskUpdate: any = {
      $inc: { actualMinutes: validated.durationMinutes },
    };

    if (validated.completed) {
      taskUpdate.$set = {
        status: "completed",
        completedAt: new Date(),
      };
    }

    await Task.updateOne({ _id: validated.taskId, userId: authUser.id }, taskUpdate);

    return NextResponse.json({ session }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/focus error:", err);
    return NextResponse.json({ error: err.message || "Failed to record focus session" }, { status: 400 });
  }
}
