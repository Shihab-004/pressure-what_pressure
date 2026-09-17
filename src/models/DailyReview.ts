import mongoose, { Schema, Document, Model } from "mongoose";
import { IDailyReview } from "@/types";

export interface IDailyReviewDocument extends Omit<IDailyReview, "_id">, Document {}

const DailyReviewSchema = new Schema<IDailyReviewDocument>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    completedCount: { type: Number, default: 0 },
    missedCount: { type: Number, default: 0 },
    focusTimeMinutes: { type: Number, default: 0 },
    mood: {
      type: String,
      enum: ["good", "normal", "overloaded"],
      default: "normal",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

DailyReviewSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyReview: Model<IDailyReviewDocument> =
  mongoose.models.DailyReview ||
  mongoose.model<IDailyReviewDocument>("DailyReview", DailyReviewSchema);
