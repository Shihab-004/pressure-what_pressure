import mongoose, { Schema, Document, Model } from "mongoose";
import { IGoal } from "@/types";

export interface IGoalDocument extends Omit<IGoal, "_id">, Document {}

const GoalSchema = new Schema<IGoalDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["long_term", "year", "month", "week", "today"],
      default: "month",
      index: true,
    },
    parentGoalId: { type: Schema.Types.ObjectId, ref: "Goal", default: null },
    status: {
      type: String,
      enum: ["active", "achieved", "paused"],
      default: "active",
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

GoalSchema.index({ userId: 1, type: 1 });

export const Goal: Model<IGoalDocument> =
  mongoose.models.Goal || mongoose.model<IGoalDocument>("Goal", GoalSchema);
