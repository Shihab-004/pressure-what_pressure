"use client";

import React, { useState, useEffect } from "react";
import { FolderKanban, Plus, Calendar, CheckCircle2, Clock, X, Loader2 } from "lucide-react";
import { IProject } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { formatDateLabel } from "@/lib/utils";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

export function ProjectsView() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Rover");
  const [saving, setSaving] = useState(false);

  const { apiFetch } = useApi();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    const { data, error } = await apiFetch("/api/projects");
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      setProjects(data?.projects || []);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    const { error } = await apiFetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), description, category }),
    });
    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Project created!");
      setIsAddOpen(false);
      setName("");
      setDescription("");
      loadProjects();
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
            <SpiderLogo className="w-4 h-4 text-primary" />
            Project Management
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Initiatives & Technical Projects
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-glow-crimson-sm border border-red-400/30 self-start sm:self-auto active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-muted-foreground">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="p-10 rounded-2xl bg-card border border-border text-center space-y-2 shadow-specular-card">
          <FolderKanban className="w-10 h-10 text-muted-foreground/60 mx-auto" />
          <p className="text-sm font-semibold text-foreground">No projects created yet.</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create an initiative like Mars Rover, Hackathon, or Client System to group tasks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => {
            const stats = proj.taskStats || { total: 0, completed: 0, pending: 0 };
            const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

            return (
              <div
                key={proj._id}
                className="p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-specular-card space-y-4 hover:border-primary/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-secondary-foreground border border-border/70">
                      {proj.category}
                    </span>
                    <h2 className="text-lg font-bold text-foreground mt-2 leading-snug">
                      {proj.name}
                    </h2>
                    {proj.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {proj.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-display tabular-nums font-bold text-primary">{progress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 shadow-glow-crimson-sm"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/70">
                  <span className="font-medium">
                    {stats.completed} of {stats.total} tasks completed
                  </span>
                  {proj.deadline && (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Calendar className="w-3 h-3" />
                      Due {formatDateLabel(proj.deadline)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Project Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-2xl glass-panel animate-scaleIn">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground">Create Project</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mars Rover Navigation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none"
                >
                  <option value="Rover">Rover</option>
                  <option value="Career">Career</option>
                  <option value="Business">Business</option>
                  <option value="University">University</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Goals, specs, scope..."
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
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
