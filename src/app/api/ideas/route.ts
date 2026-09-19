import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Idea } from "@/models/Idea";
import { z } from "zod";

const CreateIdeaSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().optional().default(""),
  category: z.string().default("Tech"),
  stage: z.enum(["spark", "exploring", "validated"]).default("spark"),
  tags: z.array(z.string()).default([]),
  isPinned: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const stage = searchParams.get("stage");
    const search = searchParams.get("search");

    const query: any = { userId: authUser.id };
    if (category && category !== "All") query.category = category;
    if (stage && stage !== "all") query.stage = stage;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const ideas = await Idea.find(query)
      .sort({ isPinned: -1, updatedAt: -1 })
      .lean();

    return NextResponse.json({
      ideas: ideas.map((i: any) => ({ ...i, _id: i._id.toString() })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch ideas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = CreateIdeaSchema.parse(body);

    await connectToDatabase();
    const newIdea = await Idea.create({
      ...validated,
      userId: authUser.id,
    });

    return NextResponse.json({ idea: newIdea }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create idea" }, { status: 400 });
  }
}
