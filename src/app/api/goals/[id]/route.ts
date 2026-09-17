import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Goal } from "@/models/Goal";
import { Task } from "@/models/Task";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const goal = await Goal.findOne({ _id: params.id, userId: authUser.id }).lean();
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    const linkedTasks = await Task.find({ goalId: params.id, userId: authUser.id });

    return NextResponse.json({ goal, linkedTasks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch goal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    await connectToDatabase();

    const updated = await Goal.findOneAndUpdate(
      { _id: params.id, userId: authUser.id },
      { $set: body },
      { new: true }
    );

    if (!updated) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    return NextResponse.json({ goal: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update goal" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const deleted = await Goal.findOneAndDelete({ _id: params.id, userId: authUser.id });
    if (!deleted) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete goal" }, { status: 500 });
  }
}
