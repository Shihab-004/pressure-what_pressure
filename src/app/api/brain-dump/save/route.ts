import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/models/Task";

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const { tasks } = await req.json();
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "No tasks provided" }, { status: 400 });
    }

    await connectToDatabase();

    const tasksToInsert = tasks.map((t) => ({
      userId: authUser.id,
      title: t.title || "Untitled Task",
      category: t.category || "Personal",
      priority: t.priority || "medium",
      status: "inbox",
      estimatedMinutes: t.estimatedMinutes || 45,
      deadline: t.deadline ? new Date(t.deadline) : null,
      source: "brain_dump",
    }));

    const created = await Task.insertMany(tasksToInsert);

    return NextResponse.json({
      success: true,
      count: created.length,
      tasks: created,
    });
  } catch (err: any) {
    console.error("POST /api/brain-dump/save error:", err);
    return NextResponse.json({ error: err.message || "Failed to save tasks" }, { status: 500 });
  }
}
