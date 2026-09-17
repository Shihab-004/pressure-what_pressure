import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Project } from "@/models/Project";
import { Task } from "@/models/Task";
import { z } from "zod";

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().optional().default(""),
  category: z.string().default("General"),
  status: z.enum(["active", "paused", "completed"]).default("active"),
  startDate: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  goalId: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const projects = await Project.find({ userId: authUser.id }).sort({ createdAt: -1 }).lean();

    // Attach task stats for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (p: any) => {
        const total = await Task.countDocuments({ userId: authUser.id, projectId: p._id });
        const completed = await Task.countDocuments({
          userId: authUser.id,
          projectId: p._id,
          status: "completed",
        });
        return {
          ...p,
          _id: p._id.toString(),
          taskStats: {
            total,
            completed,
            pending: total - completed,
          },
        };
      })
    );

    return NextResponse.json({ projects: projectsWithStats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = CreateProjectSchema.parse(body);

    await connectToDatabase();
    const newProject = await Project.create({
      ...validated,
      userId: authUser.id,
      startDate: validated.startDate ? new Date(validated.startDate) : null,
      deadline: validated.deadline ? new Date(validated.deadline) : null,
    });

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create project" }, { status: 400 });
  }
}
