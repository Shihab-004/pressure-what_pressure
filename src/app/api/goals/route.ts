import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Goal } from "@/models/Goal";
import { Task } from "@/models/Task";
import { z } from "zod";

const CreateGoalSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().optional().default(""),
  type: z.enum(["long_term", "year", "month", "week", "today"]).default("month"),
  parentGoalId: z.string().nullable().optional(),
  status: z.enum(["active", "achieved", "paused"]).default("active"),
  progress: z.number().min(0).max(100).default(0),
});

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const goals = await Goal.find({ userId: authUser.id }).sort({ createdAt: -1 }).lean();

    // Compute progress roll-up from linked tasks if tasks exist
    const goalsWithDynamicProgress = await Promise.all(
      goals.map(async (g: any) => {
        const totalLinked = await Task.countDocuments({ userId: authUser.id, goalId: g._id });
        let calculatedProgress = g.progress;

        if (totalLinked > 0) {
          const completedLinked = await Task.countDocuments({
            userId: authUser.id,
            goalId: g._id,
            status: "completed",
          });
          calculatedProgress = Math.round((completedLinked / totalLinked) * 100);
        }

        return {
          ...g,
          _id: g._id.toString(),
          progress: calculatedProgress,
          linkedTasksCount: totalLinked,
        };
      })
    );

    return NextResponse.json({ goals: goalsWithDynamicProgress });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = CreateGoalSchema.parse(body);

    await connectToDatabase();
    const newGoal = await Goal.create({
      ...validated,
      userId: authUser.id,
    });

    return NextResponse.json({ goal: newGoal }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create goal" }, { status: 400 });
  }
}
