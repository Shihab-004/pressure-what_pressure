import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Idea } from "@/models/Idea";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    await connectToDatabase();

    const updated = await Idea.findOneAndUpdate(
      { _id: params.id, userId: authUser.id },
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({ idea: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update idea" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const deleted = await Idea.findOneAndDelete({ _id: params.id, userId: authUser.id });

    if (!deleted) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete idea" }, { status: 500 });
  }
}
