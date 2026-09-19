"use client";

import React, { useState, useEffect } from "react";
import {
  Lightbulb,
  Plus,
  Search,
  Sparkles,
  Compass,
  CheckCircle2,
  Trash2,
  Pin,
  ArrowRight,
  FolderKanban,
  CheckSquare,
  Edit3,
  X,
  Loader2,
} from "lucide-react";
import { IIdea, IdeaStage } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";
import { SpiderLogo } from "@/components/icons/SpiderLogo";
import { formatDateLabel } from "@/lib/utils";

interface IdeasVaultViewProps {
  onConvertToTask: (idea: IIdea) => void;
  onConvertToProject: (idea: IIdea) => void;
}

export function IdeasVaultView({ onConvertToTask, onConvertToProject }: IdeasVaultViewProps) {
  const { user, loading: authLoading } = useAuth();
  const [ideas, setIdeas] = useState<IIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Quick Add State
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Tech");
  const [stage, setStage] = useState<IdeaStage>("spark");
  const [tagsString, setTagsString] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit State
  const [editingIdea, setEditingIdea] = useState<IIdea | null>(null);

  const { apiFetch } = useApi();

  useEffect(() => {
    if (!authLoading) {
      loadIdeas();
    }
  }, [authLoading, user]);

  async function loadIdeas() {
    setLoading(true);
    const { data, error } = await apiFetch("/api/ideas");
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      setIdeas(data?.ideas || []);
    }
  }

  async function handleCreateIdea(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    const tags = tagsString
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { data, error } = await apiFetch("/api/ideas", {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        description,
        category,
        stage,
        tags,
      }),
    });
    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Innovative idea captured!");
      if (data?.idea) {
        setIdeas((prev) => [data.idea, ...prev]);
      }
      setIsAdding(false);
      setTitle("");
      setDescription("");
      setTagsString("");
    }
  }

  async function handleTogglePin(idea: IIdea) {
    const nextPin = !idea.isPinned;
    setIdeas((prev) =>
      prev.map((i) => (i._id === idea._id ? { ...i, isPinned: nextPin } : i))
    );

    const { error } = await apiFetch(`/api/ideas/${idea._id}`, {
      method: "PATCH",
      body: JSON.stringify({ isPinned: nextPin }),
    });

    if (error) {
      toast.error(error);
      loadIdeas();
    }
  }

  async function handleUpdateStage(idea: IIdea, nextStage: IdeaStage) {
    setIdeas((prev) =>
      prev.map((i) => (i._id === idea._id ? { ...i, stage: nextStage } : i))
    );

    const { error } = await apiFetch(`/api/ideas/${idea._id}`, {
      method: "PATCH",
      body: JSON.stringify({ stage: nextStage }),
    });

    if (error) {
      toast.error(error);
      loadIdeas();
    } else {
      toast.success(`Idea stage updated to ${nextStage}`);
    }
  }

  async function handleDeleteIdea(ideaId: string) {
    if (!window.confirm("Are you sure you want to delete this idea?")) return;

    setIdeas((prev) => prev.filter((i) => i._id !== ideaId));
    const { error } = await apiFetch(`/api/ideas/${ideaId}`, {
      method: "DELETE",
    });

    if (error) {
      toast.error(error);
      loadIdeas();
    } else {
      toast.info("Idea deleted from vault");
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingIdea || !editingIdea.title.trim()) return;

    const { error } = await apiFetch(`/api/ideas/${editingIdea._id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: editingIdea.title,
        description: editingIdea.description,
        category: editingIdea.category,
        stage: editingIdea.stage,
      }),
    });

    if (error) {
      toast.error(error);
    } else {
      toast.success("Idea updated");
      setIdeas((prev) =>
        prev.map((i) => (i._id === editingIdea._id ? editingIdea : i))
      );
      setEditingIdea(null);
    }
  }

  // Filter ideas
  const filteredIdeas = ideas.filter((idea) => {
    if (selectedStage !== "all" && idea.stage !== selectedStage) return false;
    if (selectedCategory !== "All" && idea.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = idea.title.toLowerCase().includes(q);
      const matchDesc = idea.description?.toLowerCase().includes(q);
      const matchTag = idea.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }
    return true;
  });

  const categories = ["All", "Tech", "Startup", "Robotics", "AI/ML", "Creative", "Personal"];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-display font-bold flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Innovation Vault & Idea Lab
          </div>
          <h1 className="text-2xl font-display font-extrabold tracking-tight text-foreground">
            Creative Sparks & Breakthrough Thoughts
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding((prev) => !prev)}
          className="spider-btn-primary self-start sm:self-auto flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Idea</span>
        </button>
      </div>

      {/* Quick Add Form */}
      {isAdding && (
        <div className="spider-hero-card p-5 space-y-4 animate-scaleIn border-primary/40">
          <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-display font-bold text-foreground">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Capture Raw Idea or Innovation</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateIdea} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-muted-foreground mb-1">
                Idea Title / Core Concept *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Autonomous Solar Rover with Dual LiDAR SLAM"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-secondary/60 border border-border/80 rounded-xl text-foreground text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/60"
              />
            </div>

            <div>
              <label className="block font-semibold text-muted-foreground mb-1">
                Deep Notes / Problem Solved / Mechanics
              </label>
              <textarea
                rows={3}
                placeholder="Describe how it works, technical requirements, potential value, market or research angle..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-secondary/60 border border-border/80 rounded-xl text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/60 font-sans leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/60 border border-border/80 rounded-xl text-foreground focus:outline-none"
                >
                  <option value="Tech">Tech</option>
                  <option value="Startup">Startup</option>
                  <option value="Robotics">Robotics</option>
                  <option value="AI/ML">AI / ML</option>
                  <option value="Creative">Creative</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Initial Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                  className="w-full px-3 py-2 bg-secondary/60 border border-border/80 rounded-xl text-foreground focus:outline-none"
                >
                  <option value="spark">⚡ Spark (Raw thought)</option>
                  <option value="exploring">🔍 Exploring (Researching)</option>
                  <option value="validated">🚀 Validated (Ready to build)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. ROS2, Python, Hardware"
                  value={tagsString}
                  onChange={(e) => setTagsString(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/60 border border-border/80 rounded-xl text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="spider-btn-secondary spider-btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="spider-btn-primary spider-btn-sm flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                <span>Capture to Vault</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/80 pb-3">
          {/* Stage Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
            {[
              { key: "all", label: "All Ideas" },
              { key: "spark", label: "⚡ Sparks" },
              { key: "exploring", label: "🔍 Exploring" },
              { key: "validated", label: "🚀 Validated" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedStage(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-display tracking-wide uppercase transition-all whitespace-nowrap ${
                  selectedStage === tab.key
                    ? "bg-primary text-white shadow-glow-crimson font-bold border border-red-400/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search thoughts & tags..."
              className="w-full pl-9 pr-3 py-1.5 bg-secondary/50 border border-border/80 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 font-sans"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-[11px] font-display font-medium uppercase tracking-wider border transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-primary/20 text-primary border-primary/50 font-bold shadow-glow-crimson-sm"
                  : "bg-secondary/40 text-muted-foreground border-border/80 hover:bg-secondary hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ideas List Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground">Loading idea vault...</div>
      ) : filteredIdeas.length === 0 ? (
        <div className="spider-card p-10 text-center space-y-2.5">
          <Lightbulb className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <p className="text-sm font-display font-bold text-foreground">No ideas recorded in this view</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Click "+ New Idea" above to jot down a breakthrough concept before inspiration disappears.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIdeas.map((idea) => {
            const stageConfig = {
              spark: { label: "Spark", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
              exploring: { label: "Exploring", color: "text-sky-400 bg-sky-400/10 border-sky-400/30" },
              validated: { label: "Validated", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
            }[idea.stage] || { label: "Spark", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" };

            return (
              <div
                key={idea._id}
                className={`spider-card p-5 space-y-3 flex flex-col justify-between transition-all hover:border-primary/50 ${
                  idea.isPinned ? "border-amber-400/40 bg-amber-500/[0.03]" : ""
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border/70">
                        {idea.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wider border ${stageConfig.color}`}>
                        {stageConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(idea)}
                        className={`p-1.5 rounded-lg hover:bg-secondary transition-colors ${
                          idea.isPinned ? "text-amber-400 fill-amber-400" : "hover:text-foreground"
                        }`}
                        title={idea.isPinned ? "Unpin idea" : "Pin idea to top"}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingIdea(idea)}
                        className="p-1.5 rounded-lg hover:bg-secondary hover:text-foreground transition-colors"
                        title="Edit idea"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteIdea(idea._id)}
                        className="p-1.5 rounded-lg hover:bg-secondary hover:text-red-400 transition-colors"
                        title="Delete idea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-display font-bold text-foreground leading-snug">
                    {idea.title}
                  </h3>

                  {idea.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-4">
                      {idea.description}
                    </p>
                  )}

                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {idea.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] bg-secondary/50 text-muted-foreground font-sans border border-border/50"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 1-Click Conversion Actions & Stage Selector */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onConvertToTask(idea)}
                      className="spider-btn-secondary spider-btn-sm text-[11px] py-1 px-2.5 flex items-center gap-1 border-primary/30 hover:border-primary/60 text-foreground"
                      title="Convert this idea into a scheduled task"
                    >
                      <CheckSquare className="w-3 h-3 text-primary" />
                      <span>Make Task</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onConvertToProject(idea)}
                      className="spider-btn-secondary spider-btn-sm text-[11px] py-1 px-2.5 flex items-center gap-1 border-primary/30 hover:border-primary/60 text-foreground"
                      title="Convert this idea into a full project"
                    >
                      <FolderKanban className="w-3 h-3 text-rose-400" />
                      <span>Make Project</span>
                    </button>
                  </div>

                  {/* Move Stage Quick Picker */}
                  <div className="flex items-center gap-1">
                    {idea.stage !== "validated" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStage(
                            idea,
                            idea.stage === "spark" ? "exploring" : "validated"
                          )
                        }
                        className="text-[10px] font-display font-semibold text-primary hover:underline flex items-center gap-0.5"
                      >
                        Advance →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Idea Modal */}
      {editingIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-2xl glass-panel animate-scaleIn">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground">Edit Idea</h3>
              <button
                onClick={() => setEditingIdea(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={editingIdea.title}
                  onChange={(e) =>
                    setEditingIdea({ ...editingIdea, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-secondary/60 border border-border/80 rounded-xl text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Notes</label>
                <textarea
                  rows={4}
                  value={editingIdea.description || ""}
                  onChange={(e) =>
                    setEditingIdea({ ...editingIdea, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-secondary/60 border border-border/80 rounded-xl text-foreground focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Category</label>
                  <select
                    value={editingIdea.category}
                    onChange={(e) =>
                      setEditingIdea({ ...editingIdea, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-secondary/60 border border-border/80 rounded-xl text-foreground focus:outline-none"
                  >
                    <option value="Tech">Tech</option>
                    <option value="Startup">Startup</option>
                    <option value="Robotics">Robotics</option>
                    <option value="AI/ML">AI / ML</option>
                    <option value="Creative">Creative</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Stage</label>
                  <select
                    value={editingIdea.stage}
                    onChange={(e) =>
                      setEditingIdea({ ...editingIdea, stage: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-secondary/60 border border-border/80 rounded-xl text-foreground focus:outline-none"
                  >
                    <option value="spark">⚡ Spark</option>
                    <option value="exploring">🔍 Exploring</option>
                    <option value="validated">🚀 Validated</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setEditingIdea(null)}
                  className="spider-btn-secondary spider-btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="spider-btn-primary spider-btn-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
