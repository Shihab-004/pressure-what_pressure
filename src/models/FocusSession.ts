import mongoose, { Schema, Document, Model } from "mongoose";
import { IFocusSession } from "@/types";

export interface IFocusSessionDocument
  extends Omit<IFocusSession, "_id" | "taskId" | "startedAt" | "endedAt">,
    Document {
  taskId: mongoose.Types.ObjectId;
  startedAt: Date;
  endedAt?: Date | null;
}

const FocusSessionSchema = new Schema<IFocusSessionDocument>(
  {
    userId: { type: String, required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    durationMinutes: { type: Number, required: true, default: 0 },
    completed: { type: Boolean, default: false },
    interruptions: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

FocusSessionSchema.index({ userId: 1, startedAt: -1 });

export const FocusSession: Model<IFocusSessionDocument> =
  mongoose.models.FocusSession ||
  mongoose.model<IFocusSessionDocument>("FocusSession", FocusSessionSchema);
