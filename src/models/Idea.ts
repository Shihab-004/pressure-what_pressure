import mongoose, { Schema, Document, Model } from "mongoose";
import { IIdea } from "@/types";

export interface IIdeaDocument extends Omit<IIdea, "_id">, Document {}

const IdeaSchema = new Schema<IIdeaDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "Tech" },
    stage: {
      type: String,
      enum: ["spark", "exploring", "validated"],
      default: "spark",
      index: true,
    },
    tags: [{ type: String, trim: true }],
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

IdeaSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

export const Idea: Model<IIdeaDocument> =
  mongoose.models.Idea || mongoose.model<IIdeaDocument>("Idea", IdeaSchema);
