import mongoose, { Schema, Document, Model } from "mongoose";
import { ICourse } from "@/types";

export interface ICourseDocument extends Omit<ICourse, "_id">, Document {}

const CourseSchema = new Schema<ICourseDocument>(
  {
    userId: { type: String, required: true, index: true },
    code: { type: String, required: true, trim: true }, // e.g. "MTE 3101"
    name: { type: String, required: true, trim: true }, // e.g. "Control Systems"
    semester: { type: String, default: "Current Semester" },
    color: { type: String, default: "#3b82f6" },
    instructor: { type: String, default: "" },
    credits: { type: Number, default: 3 },
    modules: [
      {
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ["assignment", "lab", "exam", "quiz", "presentation", "note"],
          default: "assignment",
        },
        completed: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

CourseSchema.index({ userId: 1, code: 1 });

export const Course: Model<ICourseDocument> =
  mongoose.models.Course || mongoose.model<ICourseDocument>("Course", CourseSchema);
