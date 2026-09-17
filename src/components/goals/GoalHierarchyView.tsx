"use client";

import React, { useState, useEffect } from "react";
import { Target, Plus, ChevronRight, CheckCircle2, X, Loader2 } from "lucide-react";
import { IGoal } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

export function GoalHierarchyView() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IGoal["type"]>("month");
  const [parentGoalId, setParentGoalId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const { apiFetch } = useApi();

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    setLoading(true);
    const { data, error } = await apiFetch("/api/goals");
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      setGoals(data?.goals || []);
    }
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    const { error } = await apiFetch("/api/goals", {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        description,
        type,
        parentGoalId: parentGoalId || null,
        progress: 0,
      }),
    });
    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Goal created!");
      setIsAddOpen(false);
      setTitle("");
      setDescription("");
      loadGoals();
    }
  }

  const typeLabels = {
    long_term: "Vision / Long-Term",
    year: "Annual / 1-Year",
    month: "Quarterly / Month",
    week: "Weekly Objective",
    today: "Daily Milestone",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
            <SpiderLogo className="w-4 h-4 text-primary" />
            Goal Hierarchy Engine
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Vision → Year → Month → Week → Task
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-glow-crimson-sm border border-red-400/30 self-start sm:self-auto active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          New Goal
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-muted-foreground">Loading goal hierarchy...</div>
      ) : goals.length === 0 ? (
        <div className="p-10 rounded-2xl bg-card border border-border text-center space-y-2 shadow-specular-card">
          <Target className="w-10 h-10 text-muted-foreground/60 mx-auto" />
          <p className="text-sm font-semibold text-foreground">No goals defined yet.</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Define a high-level vision or yearly goal to anchor your daily tasks to purposeful outcomes.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {["long_term", "year", "month", "week", "today"].map((tier) => {
            const tierGoals = goals.filter((g) => g.type === tier);
            if (tierGoals.length === 0) return null;

            return (
              <div key={tier} className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {typeLabels[tier as keyof typeof typeLabels]}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tierGoals.map((goal) => (
                    <div
                      key={goal._id}
                      className="p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-specular-card space-y-3.5 hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-bold text-foreground leading-snug">
                            {goal.title}
                          </h4>
                          {goal.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {goal.description}
                            </p>
                          )}
                        </div>
                        <span className="font-display tabular-nums text-xs font-bold text-primary">
                          {goal.progress}%
                        </span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 shadow-glow-crimson-sm"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                        <span className="font-medium">{goal.linkedTasksCount || 0} linked tasks</span>
                        <span className="capitalize font-medium">{goal.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-2xl glass-panel animate-scaleIn">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground">Create Goal Milestone</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master ROS2 Autonomous Navigation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Horizon Level</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none"
                >
                  <option value="long_term">Long-Term Vision</option>
                  <option value="year">1-Year Annual Goal</option>
                  <option value="month">Monthly Goal</option>
                  <option value="week">Weekly Objective</option>
                  <option value="today">Daily Milestone</option>
                </select>
              </div>

              {goals.length > 0 && (
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Parent Goal Alignment
                  </label>
                  <select
                    value={parentGoalId}
                    onChange={(e) => setParentGoalId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none"
                  >
                    <option value="">None (Root Horizon)</option>
                    {goals.map((g) => (
                      <option key={g._id} value={g._id}>
                        [{g.type}] {g.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 resize-none font-sans"
                />
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
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
