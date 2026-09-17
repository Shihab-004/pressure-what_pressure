import mongoose, { Schema, Document, Model } from "mongoose";
import { IWeeklyPlan } from "@/types";

export interface IWeeklyPlanDocument extends Omit<IWeeklyPlan, "_id">, Document {}

const WeeklyPlanSchema = new Schema<IWeeklyPlanDocument>(
  {
    userId: { type: String, required: true, index: true },
    weekStart: { type: String, required: true }, // YYYY-MM-DD
    weekEnd: { type: String, required: true },   // YYYY-MM-DD
    tasks: [
      {
        taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
        scheduledDate: { type: String, required: true },
        plannedMinutes: { type: Number, default: 45 },
      },
    ],
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

WeeklyPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const WeeklyPlan: Model<IWeeklyPlanDocument> =
  mongoose.models.WeeklyPlan ||
  mongoose.model<IWeeklyPlanDocument>("WeeklyPlan", WeeklyPlanSchema);
