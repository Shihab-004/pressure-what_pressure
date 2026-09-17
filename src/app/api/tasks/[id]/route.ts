import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/models/Task";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const task = await Task.findOne({ _id: params.id, userId: authUser.id });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    await connectToDatabase();

    // Check if task exists and belongs to this user
    const existingTask = await Task.findOne({ _id: params.id, userId: authUser.id });
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
    }

    const updatePayload: any = { ...body };

    // Auto-stamp completedAt
    if (body.status === "completed" && existingTask.status !== "completed") {
      updatePayload.completedAt = new Date();
    } else if (body.status && body.status !== "completed") {
      updatePayload.completedAt = null;
    }

    if (body.deadline !== undefined) {
      updatePayload.deadline = body.deadline ? new Date(body.deadline) : null;
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: params.id, userId: authUser.id },
      { $set: updatePayload },
      { new: true }
    );

    return NextResponse.json({ task: updatedTask });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update task" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const result = await Task.findOneAndDelete({ _id: params.id, userId: authUser.id });
    if (!result) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete task" }, { status: 500 });
  }
}
