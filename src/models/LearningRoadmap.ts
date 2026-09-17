import mongoose, { Schema, Document, Model } from "mongoose";
import { ILearningRoadmap } from "@/types";

export interface ILearningRoadmapDocument extends Omit<ILearningRoadmap, "_id">, Document {}

const LearningRoadmapSchema = new Schema<ILearningRoadmapDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true }, // e.g. "ROS2 Robotics"
    category: { type: String, default: "Engineering" },
    status: {
      type: String,
      enum: ["active", "backlog", "completed"],
      default: "backlog",
      index: true,
    },
    topics: [
      {
        title: { type: String, required: true },
        status: {
          type: String,
          enum: ["not_started", "in_progress", "completed"],
          default: "not_started",
        },
        notes: { type: String, default: "" },
        subtopics: [
          {
            title: { type: String, required: true },
            completed: { type: Boolean, default: false },
          },
        ],
      },
    ],
    progress: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

LearningRoadmapSchema.index({ userId: 1, status: 1 });

export const LearningRoadmap: Model<ILearningRoadmapDocument> =
  mongoose.models.LearningRoadmap ||
  mongoose.model<ILearningRoadmapDocument>("LearningRoadmap", LearningRoadmapSchema);
