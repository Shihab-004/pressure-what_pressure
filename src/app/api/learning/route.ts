import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { LearningRoadmap } from "@/models/LearningRoadmap";
import { z } from "zod";

const CreateRoadmapSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  category: z.string().default("Engineering"),
  status: z.enum(["active", "backlog", "completed"]).default("backlog"),
  notes: z.string().optional().default(""),
  topics: z
    .array(
      z.object({
        title: z.string(),
        status: z.enum(["not_started", "in_progress", "completed"]).default("not_started"),
        notes: z.string().optional().default(""),
        subtopics: z
          .array(
            z.object({
              title: z.string(),
              completed: z.boolean().default(false),
            })
          )
          .default([]),
      })
    )
    .default([]),
});

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const roadmaps = await LearningRoadmap.find({ userId: authUser.id })
      .sort({ status: 1, updatedAt: -1 })
      .lean();

    // Dynamically calculate progress % based on subtopics & topics
    const calculatedRoadmaps = roadmaps.map((rm: any) => {
      let totalItems = 0;
      let completedItems = 0;

      rm.topics.forEach((top: any) => {
        if (top.subtopics && top.subtopics.length > 0) {
          top.subtopics.forEach((sub: any) => {
            totalItems++;
            if (sub.completed) completedItems++;
          });
        } else {
          totalItems++;
          if (top.status === "completed") completedItems++;
        }
      });

      const dynamicProgress =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : rm.progress || 0;

      return {
        ...rm,
        _id: rm._id.toString(),
        progress: dynamicProgress,
      };
    });

    const activeRoadmaps = calculatedRoadmaps.filter((r) => r.status === "active");
    const backlogRoadmaps = calculatedRoadmaps.filter((r) => r.status === "backlog");
    const completedRoadmaps = calculatedRoadmaps.filter((r) => r.status === "completed");

    return NextResponse.json({
      roadmaps: calculatedRoadmaps,
      activeRoadmaps,
      backlogRoadmaps,
      completedRoadmaps,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch roadmaps" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = CreateRoadmapSchema.parse(body);

    await connectToDatabase();

    // Check active limit
    if (validated.status === "active") {
      const activeCount = await LearningRoadmap.countDocuments({
        userId: authUser.id,
        status: "active",
      });
      if (activeCount >= 3) {
        return NextResponse.json(
          {
            error:
              "Active learning limit reached (max 3). Keep focus high by moving others to Backlog.",
          },
          { status: 400 }
        );
      }
    }

    const newRoadmap = await LearningRoadmap.create({
      ...validated,
      userId: authUser.id,
    });

    return NextResponse.json({ roadmap: newRoadmap }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create roadmap" }, { status: 400 });
  }
}
