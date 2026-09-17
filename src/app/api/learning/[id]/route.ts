import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { LearningRoadmap } from "@/models/LearningRoadmap";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    await connectToDatabase();

    // If changing to active, ensure max 3 active
    if (body.status === "active") {
      const activeCount = await LearningRoadmap.countDocuments({
        userId: authUser.id,
        status: "active",
        _id: { $ne: params.id },
      });
      if (activeCount >= 3) {
        return NextResponse.json(
          {
            error:
              "You already have 3 active roadmaps. Move an existing one to backlog to maintain focus.",
          },
          { status: 400 }
        );
      }
    }

    const updated = await LearningRoadmap.findOneAndUpdate(
      { _id: params.id, userId: authUser.id },
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }

    return NextResponse.json({ roadmap: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update roadmap" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const deleted = await LearningRoadmap.findOneAndDelete({ _id: params.id, userId: authUser.id });
    if (!deleted) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete roadmap" }, { status: 500 });
  }
}
