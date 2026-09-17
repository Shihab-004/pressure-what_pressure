import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "@/types";

export interface IUserDocument extends Omit<IUser, "_id">, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    name: { type: String, default: "User" },
    avatar: { type: String },
    timezone: { type: String, default: "UTC" },
    preferences: {
      workDays: { type: [Number], default: [0, 1, 2, 3, 4] }, // Sun-Thu or customizable
      dailyWorkHours: { type: Number, default: 5.5 },
      notificationSettings: {
        overloadWarning: { type: Boolean, default: true },
        urgentDeadline: { type: Boolean, default: true },
        idleGoalAlert: { type: Boolean, default: true },
      },
      theme: { type: String, enum: ["light", "dark", "system"], default: "dark" },
    },
  },
  { timestamps: true }
);

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
