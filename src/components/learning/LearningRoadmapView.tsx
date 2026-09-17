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
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          New Roadmap
        </button>
      </div>

      {/* Active vs Backlog Control Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === "active"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <span>Active Roadmaps</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary-foreground/20 font-mono">
            {activeCount}/3
          </span>
        </button>

        <button
          onClick={() => setActiveTab("backlog")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === "backlog"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <span>Skill Backlog</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-secondary text-muted-foreground font-mono">
            {roadmaps.filter((r) => r.status === "backlog").length}
          </span>
        </button>

        <span className="ml-auto text-[11px] text-muted-foreground hidden sm:inline-block">
          Active limit (max 3) minimizes context-switching.
        </span>
      </div>

      {/* Roadmaps Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">Loading learning system...</div>
      ) : displayedRoadmaps.length === 0 ? (
        <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-2">
          <Compass className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium text-foreground">
            {activeTab === "active" ? "No active roadmaps." : "No skills currently in backlog."}
          </p>
          <p className="text-xs text-muted-foreground">
            {activeTab === "active"
              ? "Activate a skill from the Backlog or create a new roadmap."
              : "The backlog keeps future topics safely stored until you are ready."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedRoadmaps.map((rm) => (
            <div
              key={rm._id}
              className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4 hover:border-primary/40 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border">
                      {rm.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-primary">{rm.progress}%</span>
                  </div>
                  <h2 className="text-lg font-semibold text-foreground leading-snug">{rm.title}</h2>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(rm)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border transition-colors whitespace-nowrap"
                >
                  {rm.status === "active" ? "Move to Backlog" : "Activate"}
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${rm.progress}%` }}
                />
              </div>

              {/* Topics Tree & Subtopics */}
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Mastery Tree
                </div>

                <div className="space-y-2">
                  {rm.topics.map((topic, tIdx) => {
                    const isTopicComplete = topic.status === "completed";
                    return (
                      <div key={tIdx} className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                          {isTopicComplete ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          )}
                          <span>{topic.title}</span>
                        </div>

                        {/* Subtopics */}
                        {topic.subtopics && topic.subtopics.length > 0 && (
                          <div className="ml-5 space-y-1 pl-2 border-l border-border/70">
                            {topic.subtopics.map((sub, sIdx) => (
                              <div
                                key={sIdx}
                                onClick={() => handleToggleSubtopic(rm._id, tIdx, sIdx, sub.completed)}
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={sub.completed}
                                  onChange={() => {}}
                                  className="rounded text-primary focus:ring-0 accent-primary"
                                />
                                <span className={sub.completed ? "line-through text-muted-foreground/60" : ""}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-foreground">Create Learning Roadmap</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoadmap} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Roadmap Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ROS2 Autonomous Navigation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
                />
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none"
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
                <label className="block font-medium text-muted-foreground mb-1">
                  Key Topics (One per line)
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g.&#10;Nodes & Topics&#10;TF2 Transforms&#10;Nav2 Costmaps&#10;Behavior Trees"
                  value={newTopicString}
                  onChange={(e) => setNewTopicString(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 resize-none font-sans"
                />
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
