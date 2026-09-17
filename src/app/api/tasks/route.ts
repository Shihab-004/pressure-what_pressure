import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/models/Task";
import { calculateDynamicPriority } from "@/lib/engine/priorityEngine";
import { z } from "zod";

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().optional().default(""),
  category: z.string().default("Personal"),
  projectId: z.string().nullable().optional(),
  goalId: z.string().nullable().optional(),
  courseId: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  status: z
    .enum(["inbox", "planned", "today", "in_progress", "completed", "paused", "cancelled"])
    .default("inbox"),
  deadline: z.string().nullable().optional(),
  estimatedMinutes: z.number().min(1).default(45),
  actualMinutes: z.number().min(0).default(0),
  scheduledDate: z.string().nullable().optional(),
  dependencies: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
  recurrence: z
    .object({
      frequency: z.enum(["daily", "weekly", "monthly", "custom"]).optional(),
      daysOfWeek: z.array(z.number()).optional(),
    })
    .optional(),
  source: z.enum(["quick_add", "brain_dump", "manual", "planner"]).default("manual"),
});

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const projectId = searchParams.get("projectId");
    const scheduledDate = searchParams.get("scheduledDate");
    const search = searchParams.get("search");

    const query: any = { userId: authUser.id };

    if (status) {
      if (status === "active") {
        query.status = { $nin: ["completed", "cancelled"] };
      } else {
        query.status = status;
      }
    }

    if (category) query.category = category;
    if (projectId) query.projectId = projectId;
    if (scheduledDate) query.scheduledDate = scheduledDate;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 }).lean();

    // Map tasks and attach real-time dynamic scores
    const tasksWithScores = tasks.map((t: any) => {
      const taskObj = { ...t, _id: t._id.toString() };
      const breakdown = calculateDynamicPriority(taskObj as any, tasks as any);
      return {
        ...taskObj,
        dynamicScore: breakdown.totalScore,
        priorityReasons: breakdown.reasons,
      };
    });

    return NextResponse.json({ tasks: tasksWithScores });
  } catch (err: any) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = CreateTaskSchema.parse(body);

    await connectToDatabase();

    const taskData: any = {
      ...validated,
      userId: authUser.id, // Strictly scoped to authenticated user
      deadline: validated.deadline ? new Date(validated.deadline) : null,
    };

    const newTask = await Task.create(taskData);
    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/tasks error:", err);
    return NextResponse.json(
      { error: err.errors ? err.errors[0]?.message : err.message || "Failed to create task" },
      { status: 400 }
    );
  }
}
