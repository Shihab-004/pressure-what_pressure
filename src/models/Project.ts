import mongoose, { Schema, Document, Model } from "mongoose";
import { IProject } from "@/types";

export interface IProjectDocument extends Omit<IProject, "_id">, Document {}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    status: {
      type: String,
      enum: ["active", "paused", "completed"],
      default: "active",
      index: true,
    },
    startDate: { type: Date, default: null },
    deadline: { type: Date, default: null },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", default: null },
  },
  { timestamps: true }
);

ProjectSchema.index({ userId: 1, status: 1 });

export const Project: Model<IProjectDocument> =
  mongoose.models.Project || mongoose.model<IProjectDocument>("Project", ProjectSchema);
