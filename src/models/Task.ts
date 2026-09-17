import mongoose, { Schema, Document, Model } from "mongoose";
import { ITask } from "@/types";

export interface ITaskDocument extends Omit<ITask, "_id">, Document {}

const TaskSchema = new Schema<ITaskDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "Personal", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", default: null, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    dynamicScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["inbox", "planned", "today", "in_progress", "completed", "paused", "cancelled"],
      default: "inbox",
      index: true,
    },
    deadline: { type: Date, default: null, index: true },
    estimatedMinutes: { type: Number, default: 45 },
    actualMinutes: { type: Number, default: 0 },
    scheduledDate: { type: String, default: null, index: true }, // Format YYYY-MM-DD
    dependencies: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    isRecurring: { type: Boolean, default: false },
    recurrence: {
      frequency: { type: String, enum: ["daily", "weekly", "monthly", "custom"] },
      daysOfWeek: [{ type: Number }],
    },
    carryOverCount: { type: Number, default: 0 },
    carryOverReason: {
      type: String,
      enum: ["not_enough_time", "too_difficult", "distracted", "no_longer_important", "other"],
      default: null,
    },
    source: {
      type: String,
      enum: ["quick_add", "brain_dump", "manual", "planner"],
      default: "manual",
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound indexes for optimal performance
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, scheduledDate: 1 });
TaskSchema.index({ userId: 1, deadline: 1 });
TaskSchema.index({ userId: 1, projectId: 1 });

export const Task: Model<ITaskDocument> =
  mongoose.models.Task || mongoose.model<ITaskDocument>("Task", TaskSchema);
