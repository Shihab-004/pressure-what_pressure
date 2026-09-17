"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Plus,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import { ICourse, ITask } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { formatDateLabel, formatMinutes } from "@/lib/utils";

interface UniversityViewProps {
  onStartFocus: (task: ITask) => void;
  onOpenNewTask: (courseId?: string) => void;
}

export function UniversityView({ onStartFocus, onOpenNewTask }: UniversityViewProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCredits, setNewCredits] = useState(3);
  const [newInstructor, setNewInstructor] = useState("");
  const [saving, setSaving] = useState(false);

  const { apiFetch } = useApi();

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    const { data, error } = await apiFetch("/api/university");
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      setCourses(data?.courses || []);
    }
  }

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim() || saving) return;

    setSaving(true);
    const { error } = await apiFetch("/api/university", {
      method: "POST",
      body: JSON.stringify({
        code: newCode.trim(),
        name: newName.trim(),
        credits: newCredits,
        instructor: newInstructor.trim(),
        modules: [
          { name: "Assignments", type: "assignment", completed: false },
          { name: "Laboratory Reports", type: "lab", completed: false },
          { name: "Final Examination", type: "exam", completed: false },
        ],
      }),
    });

    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Course added successfully!");
      setIsAddOpen(false);
      setNewCode("");
      setNewName("");
      loadCourses();
    }
  }

  async function toggleModule(courseId: string, moduleIndex: number, current: boolean) {
    const course = courses.find((c) => c._id === courseId);
    if (!course) return;

    const updatedModules = [...course.modules];
    updatedModules[moduleIndex].completed = !current;

    await apiFetch(`/api/university/${courseId}`, {
      method: "PATCH",
      body: JSON.stringify({ modules: updatedModules }),
    });

    loadCourses();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-primary" />
            University Academic Command
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Courses, Labs & Examinations
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Course
        </button>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">Loading academic workspace...</div>
      ) : courses.length === 0 ? (
        <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-2">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium text-foreground">No courses tracked yet.</p>
          <p className="text-xs text-muted-foreground">
            Add your semester courses (e.g. MTE 3101, MTE 3103) to track assignments, labs, and exams.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const tasks: ITask[] = course.tasks || [];
            const pendingTasks = tasks.filter((t) => t.status !== "completed");
            const completedCount = (course.modules || []).filter((m: any) => m.completed).length;
            const totalModules = (course.modules || []).length;
            const progress = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

            return (
              <div
                key={course._id}
                className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4 hover:border-primary/40 transition-colors"
              >
                {/* Top Title & Code */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {course.code}
                    </span>
                    <h2 className="text-lg font-semibold text-foreground mt-1.5 leading-snug">
                      {course.name}
                    </h2>
                    {course.instructor && (
                      <p className="text-xs text-muted-foreground">Instructor: {course.instructor}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-1 rounded">
                    {course.credits} Credits
                  </span>
                </div>

                {/* Modules Checklist */}
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Curriculum Modules
                  </div>
                  <div className="space-y-1">
                    {(course.modules || []).map((mod: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => toggleModule(course._id, idx, mod.completed)}
                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/60 cursor-pointer text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              mod.completed ? "text-emerald-400 fill-emerald-400/20" : "text-muted-foreground"
                            }`}
                          />
                          <span className={mod.completed ? "line-through text-muted-foreground" : "text-foreground"}>
                            {mod.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase">{mod.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Linked Tasks */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                    <span>Upcoming Deadlines ({pendingTasks.length})</span>
                    <button
                      onClick={() => onOpenNewTask(course._id)}
                      className="text-primary hover:underline flex items-center gap-0.5 normal-case"
                    >
                      <Plus className="w-3 h-3" /> Add task
                    </button>
                  </div>

                  {pendingTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-1">
                      No pending assignments or lab reports.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {pendingTasks.slice(0, 3).map((task) => (
                        <div
                          key={task._id}
                          className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-xs"
                        >
                          <span className="font-medium text-foreground truncate max-w-[200px]">
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                            {task.deadline && (
                              <span className="text-amber-400 text-[11px]">
                                {formatDateLabel(task.deadline)}
                              </span>
                            )}
                            <button
                              onClick={() => onStartFocus(task)}
                              className="px-2 py-0.5 rounded bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground text-[10px] font-medium transition-colors"
                            >
                              Focus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Course Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-foreground">Add New Course</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Course Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MTE 3101"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
                />
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Control Systems"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={newCredits}
                    onChange={(e) => setNewCredits(parseInt(e.target.value, 10) || 3)}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Instructor</label>
                  <input
                    type="text"
                    placeholder="Prof. Name"
                    value={newInstructor}
                    onChange={(e) => setNewInstructor(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-sm"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
