import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Course } from "@/models/Course";
import { Task } from "@/models/Task";
import { z } from "zod";

const CreateCourseSchema = z.object({
  code: z.string().min(1, "Course code required").trim(),
  name: z.string().min(1, "Course name required").trim(),
  semester: z.string().default("Fall 2026"),
  color: z.string().default("#3b82f6"),
  instructor: z.string().optional().default(""),
  credits: z.number().min(1).default(3),
  modules: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(["assignment", "lab", "exam", "quiz", "presentation", "note"]),
        completed: z.boolean().default(false),
      })
    )
    .default([]),
});

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const courses = await Course.find({ userId: authUser.id }).sort({ code: 1 }).lean();

    // Attach pending academic tasks for each course
    const coursesWithTasks = await Promise.all(
      courses.map(async (c: any) => {
        const tasks = await Task.find({
          userId: authUser.id,
          courseId: c._id,
        }).sort({ deadline: 1 });

        return {
          ...c,
          _id: c._id.toString(),
          tasks,
        };
      })
    );

    return NextResponse.json({ courses: coursesWithTasks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = CreateCourseSchema.parse(body);

    await connectToDatabase();
    const course = await Course.create({
      ...validated,
      userId: authUser.id,
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create course" }, { status: 400 });
  }
}
