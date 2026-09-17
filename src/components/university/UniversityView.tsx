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
import { SpiderLogo } from "@/components/icons/SpiderLogo";

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
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-glow-crimson-sm border border-red-400/30 self-start sm:self-auto active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          Add Course
        </button>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="py-24 text-center text-xs text-muted-foreground">Loading academic workspace...</div>
      ) : courses.length === 0 ? (
        <div className="p-10 rounded-2xl bg-card border border-border text-center space-y-2 shadow-specular-card">
          <BookOpen className="w-10 h-10 text-muted-foreground/60 mx-auto" />
          <p className="text-sm font-semibold text-foreground">No courses tracked yet.</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Track your semester courses (e.g. MTE 3101, MTE 3103) to schedule assignments, labs, and exams.
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
                className="p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-specular-card space-y-4 hover:border-primary/40 transition-all"
              >
                {/* Top Title & Code */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 shadow-glow-crimson-sm">
                      {course.code}
                    </span>
                    <h2 className="text-lg font-bold text-foreground mt-2 leading-snug">
                      {course.name}
                    </h2>
                    {course.instructor && (
                      <p className="text-xs text-muted-foreground mt-0.5">Instructor: {course.instructor}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-display tabular-nums bg-secondary px-2.5 py-1 rounded-lg border border-border/70">
                    {course.credits} Credits
                  </span>
                </div>

                {/* Modules Checklist */}
                <div className="space-y-2 pt-2 border-t border-border/70">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground font-display">
                    Curriculum Modules ({completedCount}/{totalModules})
                  </div>
                  <div className="space-y-1.5">
                    {(course.modules || []).map((mod: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => toggleModule(course._id, idx, mod.completed)}
                        className="flex items-center justify-between p-2 rounded-xl bg-secondary/40 hover:bg-secondary/80 cursor-pointer text-xs transition-colors border border-border/50"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              mod.completed ? "text-emerald-400 fill-emerald-400/20" : "text-muted-foreground"
                            }`}
                          />
                          <span className={mod.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"}>
                            {mod.name}
                          </span>
                        </div>
                        <span className="text-[9px] font-display font-semibold text-muted-foreground uppercase bg-card px-1.5 py-0.2 rounded border border-border/60">
                          {mod.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Linked Tasks */}
                <div className="space-y-2 pt-2 border-t border-border/70">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                    <span>Upcoming Deadlines ({pendingTasks.length})</span>
                    <button
                      onClick={() => onOpenNewTask(course._id)}
                      className="text-primary hover:underline flex items-center gap-0.5 normal-case font-semibold text-xs"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" /> Add task
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
                          className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/70 text-xs"
                        >
                          <span className="font-semibold text-foreground truncate max-w-[190px]">
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                            {task.deadline && (
                              <span className="text-amber-400 text-[11px] font-medium">
                                {formatDateLabel(task.deadline)}
                              </span>
                            )}
                            <button
                              onClick={() => onStartFocus(task)}
                              className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary hover:text-white text-[11px] font-semibold border border-primary/30 transition-all shadow-glow-crimson-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-2xl glass-panel animate-scaleIn">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground">Add New Academic Course</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Course Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MTE 3101"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Control Systems & Robotics"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={newCredits}
                    onChange={(e) => setNewCredits(parseInt(e.target.value, 10) || 3)}
                    className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Instructor</label>
                  <input
                    type="text"
                    placeholder="Prof. Name"
                    value={newInstructor}
                    onChange={(e) => setNewInstructor(e.target.value)}
                    className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-500 text-white font-semibold rounded-xl shadow-glow-crimson-sm border border-red-400/30 transition-all"
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
