import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  return NextResponse.json({ user: authUser });
}

const UpdatePreferencesSchema = z.object({
  name: z.string().min(1).optional(),
  preferences: z
    .object({
      workDays: z.array(z.number()).optional(),
      dailyWorkHours: z.number().min(1).max(24).optional(),
      notificationSettings: z
        .object({
          overloadWarning: z.boolean().optional(),
          urgentDeadline: z.boolean().optional(),
          idleGoalAlert: z.boolean().optional(),
        })
        .optional(),
      theme: z.enum(["light", "dark", "system"]).optional(),
    })
    .optional(),
});

export async function PATCH(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = UpdatePreferencesSchema.parse(body);

    await connectToDatabase();
    const updatePayload: any = {};
    if (validated.name) updatePayload.name = validated.name;
    if (validated.preferences) {
      if (validated.preferences.workDays)
        updatePayload["preferences.workDays"] = validated.preferences.workDays;
      if (validated.preferences.dailyWorkHours)
        updatePayload["preferences.dailyWorkHours"] = validated.preferences.dailyWorkHours;
      if (validated.preferences.theme)
        updatePayload["preferences.theme"] = validated.preferences.theme;
      if (validated.preferences.notificationSettings) {
        updatePayload["preferences.notificationSettings"] =
          validated.preferences.notificationSettings;
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: authUser.firebaseUid },
      { $set: updatePayload },
      { new: true }
    );

    return NextResponse.json({ user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 400 });
  }
}
