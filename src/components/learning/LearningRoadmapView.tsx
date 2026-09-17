"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  Plus,
  CheckCircle2,
  Circle,
  Archive,
  Play,
  ArrowUpRight,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { ILearningRoadmap, ILearningTopic } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

interface LearningRoadmapViewProps {
  onOpenNewTask: () => void;
}

export function LearningRoadmapView({ onOpenNewTask }: LearningRoadmapViewProps) {
  const [activeTab, setActiveTab] = useState<"active" | "backlog">("active");
  const [roadmaps, setRoadmaps] = useState<ILearningRoadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Engineering");
  const [newTopicString, setNewTopicString] = useState("");
  const [saving, setSaving] = useState(false);

  const { apiFetch } = useApi();

  useEffect(() => {
    loadRoadmaps();
  }, []);

  async function loadRoadmaps() {
    setLoading(true);
    const { data, error } = await apiFetch("/api/learning");
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      setRoadmaps(data?.roadmaps || []);
    }
  }

  async function handleToggleSubtopic(
    roadmapId: string,
    topicIdx: number,
    subIdx: number,
    currentVal: boolean
  ) {
    const roadmap = roadmaps.find((r) => r._id === roadmapId);
    if (!roadmap) return;

    const updatedTopics = JSON.parse(JSON.stringify(roadmap.topics));
    if (updatedTopics[topicIdx]?.subtopics?.[subIdx]) {
      updatedTopics[topicIdx].subtopics[subIdx].completed = !currentVal;
    }

    await apiFetch(`/api/learning/${roadmapId}`, {
      method: "PATCH",
      body: JSON.stringify({ topics: updatedTopics }),
    });

    loadRoadmaps();
  }

  async function handleToggleStatus(roadmap: ILearningRoadmap) {
    const newStatus = roadmap.status === "active" ? "backlog" : "active";
    const { error } = await apiFetch(`/api/learning/${roadmap._id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });

    if (error) {
      toast.error(error);
    } else {
      toast.success(
        newStatus === "active"
          ? `Activated "${roadmap.title}"`
          : `Moved "${roadmap.title}" to Backlog`
      );
      loadRoadmaps();
    }
  }

  async function handleCreateRoadmap(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || saving) return;

    setSaving(true);
    const topicLines = newTopicString
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const topics: ILearningTopic[] = topicLines.map((line) => ({
      title: line,
      status: "not_started",
      subtopics: [],
    }));

    const { error } = await apiFetch("/api/learning", {
      method: "POST",
      body: JSON.stringify({
        title: newTitle.trim(),
        category: newCategory,
        status: activeTab,
        topics: topics.length > 0 ? topics : [{ title: "Foundations", status: "not_started" }],
      }),
    });

    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Learning roadmap created!");
      setIsAddOpen(false);
      setNewTitle("");
      setNewTopicString("");
      loadRoadmaps();
    }
  }

  const displayedRoadmaps = roadmaps.filter((r) => r.status === activeTab);
  const activeCount = roadmaps.filter((r) => r.status === "active").length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-primary" />
            Learning OS & Technical Mastery
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Curriculum & Skill Roadmaps
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-glow-crimson-sm border border-red-400/30 self-start sm:self-auto active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          New Roadmap
        </button>
      </div>

      {/* Active vs Backlog Control Tabs with WIP limits */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "active"
              ? "bg-primary text-white shadow-glow-crimson-sm border border-red-400/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
          }`}
        >
          <span>Active Roadmaps</span>
          <span className="px-2 py-0.2 rounded text-[10px] bg-card text-foreground border border-border/80 font-display tabular-nums font-bold">
            {activeCount}/3
          </span>
        </button>

        <button
          onClick={() => setActiveTab("backlog")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "backlog"
              ? "bg-primary text-white shadow-glow-crimson-sm border border-red-400/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
          }`}
        >
          <span>Skill Backlog</span>
          <span className="px-2 py-0.2 rounded text-[10px] bg-secondary text-muted-foreground font-display tabular-nums">
            {roadmaps.filter((r) => r.status === "backlog").length}
          </span>
        </button>

        <span className="ml-auto text-[11px] text-muted-foreground hidden sm:inline-block font-display">
          Active limit (max 3) minimizes fragmentation.
        </span>
      </div>

      {/* Roadmaps Grid */}
      {loading ? (
        <div className="py-24 text-center text-xs text-muted-foreground">Loading learning system...</div>
      ) : displayedRoadmaps.length === 0 ? (
        <div className="spider-card p-10 text-center space-y-2">
          <Compass className="w-10 h-10 text-muted-foreground/60 mx-auto" />
          <p className="text-sm font-display font-bold text-foreground">
            {activeTab === "active" ? "No active roadmaps." : "No skills in backlog."}
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {activeTab === "active"
              ? "Activate a skill from the Backlog or create a new roadmap."
              : "The backlog keeps future aspirations organized."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedRoadmaps.map((rm) => (
            <div
              key={rm._id}
              className="spider-card p-5 sm:p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border/70">
                      {rm.category}
                    </span>
                    <span className="text-xs font-display font-bold tabular-nums text-primary">{rm.progress}%</span>
                  </div>
                  <h2 className="text-lg font-display font-bold text-foreground leading-snug">{rm.title}</h2>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(rm)}
                  className="px-3 py-1 text-[11px] font-semibold rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/80 transition-colors whitespace-nowrap"
                >
                  {rm.status === "active" ? "Move to Backlog" : "Activate"}
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 shadow-glow-crimson-sm"
                  style={{ width: `${rm.progress}%` }}
                />
              </div>

              {/* Topics Tree & Subtopics */}
              <div className="space-y-3 pt-2 border-t border-border/70">
                <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  Mastery Tree
                </div>

                <div className="space-y-2">
                  {rm.topics.map((topic, tIdx) => {
                    const isTopicComplete = topic.status === "completed";
                    return (
                      <div key={tIdx} className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          {isTopicComplete ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          )}
                          <span>{topic.title}</span>
                        </div>

                        {/* Subtopics */}
                        {topic.subtopics && topic.subtopics.length > 0 && (
                          <div className="ml-5 space-y-1 pl-2.5 border-l border-border/80">
                            {topic.subtopics.map((sub, sIdx) => (
                              <div
                                key={sIdx}
                                onClick={() => handleToggleSubtopic(rm._id, tIdx, sIdx, sub.completed)}
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer py-1 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={sub.completed}
                                  onChange={() => {}}
                                  className="rounded text-primary focus:ring-0 accent-primary"
                                />
                                <span className={sub.completed ? "line-through text-muted-foreground/60" : "font-medium"}>
                                  {sub.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Roadmap Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-2xl glass-panel animate-scaleIn">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground">Create Learning Roadmap</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoadmap} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Roadmap Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ROS2 Autonomous Navigation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Robotics">Robotics</option>
                  <option value="Embedded">Embedded</option>
                  <option value="Cloud">Cloud</option>
                  <option value="AI / ML">AI / ML</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Key Topics (One per line)
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g.&#10;Nodes & Topics&#10;TF2 Transforms&#10;Nav2 Costmaps&#10;Behavior Trees"
                  value={newTopicString}
                  onChange={(e) => setNewTopicString(e.target.value)}
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
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Roadmap"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
