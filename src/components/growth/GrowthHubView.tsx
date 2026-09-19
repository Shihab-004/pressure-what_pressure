"use client";

import React, { useState, useEffect } from "react";
import {
  FolderKanban,
  Compass,
  Target,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Circle,
  Play,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Sparkles,
  Layers,
} from "lucide-react";
import { IProject, IGoal, ILearningRoadmap, ITask } from "@/types";
import { useApi } from "@/lib/api/useApi";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";
import { formatDateLabel } from "@/lib/utils";
import { SpiderLogo } from "@/components/icons/SpiderLogo";
import { taskSync } from "@/lib/events/taskSync";

interface GrowthHubViewProps {
  initialTab?: "projects" | "learning" | "goals";
  onStartFocus: (task: ITask | { title: string; category: string; estimatedMinutes?: number }) => void;
  onOpenTaskModal: (params?: {
    projectId?: string;
    goalId?: string;
    title?: string;
    category?: string;
  }) => void;
}

export function GrowthHubView({
  initialTab = "projects",
  onStartFocus,
  onOpenTaskModal,
}: GrowthHubViewProps) {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"projects" | "learning" | "goals">(initialTab);

  // Projects State
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectTasks, setProjectTasks] = useState<Record<string, ITask[]>>({});
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectCategory, setProjectCategory] = useState("Rover");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectDeadline, setProjectDeadline] = useState("");
  const [savingProject, setSavingProject] = useState(false);

  // Learning State
  const [roadmaps, setRoadmaps] = useState<ILearningRoadmap[]>([]);
  const [learningTab, setLearningTab] = useState<"active" | "backlog">("active");
  const [loadingLearning, setLoadingLearning] = useState(true);
  const [isAddRoadmapOpen, setIsAddRoadmapOpen] = useState(false);
  const [newRoadmapTitle, setNewRoadmapTitle] = useState("");
  const [newRoadmapCategory, setNewRoadmapCategory] = useState("Engineering");
  const [newTopicString, setNewTopicString] = useState("");
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [newTopicInputs, setNewTopicInputs] = useState<Record<string, string>>({});

  // Goals State
  const [goals, setGoals] = useState<any[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [goalTasks, setGoalTasks] = useState<Record<string, ITask[]>>({});
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalType, setGoalType] = useState<IGoal["type"]>("month");
  const [parentGoalId, setParentGoalId] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  const { apiFetch } = useApi();

  useEffect(() => {
    if (!authLoading) {
      loadAllData();
    }
    const unsubscribe = taskSync.subscribe(() => {
      loadAllData(true);
    });
    return unsubscribe;
  }, [authLoading, user]);

  async function loadAllData(silent = false) {
    if (!silent) {
      setLoadingProjects(true);
      setLoadingLearning(true);
      setLoadingGoals(true);
    }

    const [projRes, learnRes, goalRes] = await Promise.all([
      apiFetch("/api/projects"),
      apiFetch("/api/learning"),
      apiFetch("/api/goals"),
    ]);

    if (projRes.data?.projects) setProjects(projRes.data.projects);
    if (learnRes.data?.roadmaps) setRoadmaps(learnRes.data.roadmaps);
    if (goalRes.data?.goals) setGoals(goalRes.data.goals);

    setLoadingProjects(false);
    setLoadingLearning(false);
    setLoadingGoals(false);
  }

  // --- Projects Handlers ---
  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim() || savingProject) return;

    setSavingProject(true);
    const { data, error } = await apiFetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: projectName.trim(),
        description: projectDesc,
        category: projectCategory,
        deadline: projectDeadline ? new Date(projectDeadline).toISOString() : null,
      }),
    });
    setSavingProject(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Project created!");
      setIsAddProjectOpen(false);
      setProjectName("");
      setProjectDesc("");
      setProjectDeadline("");
      loadAllData(true);
    }
  }

  async function handleDeleteProject(projectId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm("Delete this project? Linked tasks will not be deleted.")) return;

    setProjects((prev) => prev.filter((p) => p._id !== projectId));
    const { error } = await apiFetch(`/api/projects/${projectId}`, { method: "DELETE" });
    if (error) {
      toast.error(error);
      loadAllData(true);
    } else {
      toast.info("Project deleted");
    }
  }

  async function toggleProjectExpand(projectId: string) {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
      return;
    }
    setExpandedProjectId(projectId);

    // Fetch tasks belonging to this project
    const { data } = await apiFetch(`/api/tasks?projectId=${projectId}`);
    if (data?.tasks) {
      setProjectTasks((prev) => ({ ...prev, [projectId]: data.tasks }));
    }
  }

  // --- Learning Handlers ---
  async function handleCreateRoadmap(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoadmapTitle.trim() || savingRoadmap) return;

    setSavingRoadmap(true);
    const topicLines = newTopicString
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const topics = topicLines.map((line) => ({
      title: line,
      status: "not_started",
      subtopics: [],
    }));

    const { error } = await apiFetch("/api/learning", {
      method: "POST",
      body: JSON.stringify({
        title: newRoadmapTitle.trim(),
        category: newRoadmapCategory,
        status: learningTab,
        topics: topics.length > 0 ? topics : [{ title: "Foundations", status: "not_started" }],
      }),
    });
    setSavingRoadmap(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Learning roadmap created!");
      setIsAddRoadmapOpen(false);
      setNewRoadmapTitle("");
      setNewTopicString("");
      loadAllData(true);
    }
  }

  async function handleDeleteRoadmap(roadmapId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm("Delete this learning roadmap?")) return;

    setRoadmaps((prev) => prev.filter((r) => r._id !== roadmapId));
    const { error } = await apiFetch(`/api/learning/${roadmapId}`, { method: "DELETE" });
    if (error) {
      toast.error(error);
      loadAllData(true);
    } else {
      toast.info("Roadmap deleted");
    }
  }

  async function handleToggleSubtopic(roadmapId: string, topicIdx: number, subIdx: number, currentVal: boolean) {
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
    loadAllData(true);
  }

  async function handleToggleRoadmapStatus(roadmap: ILearningRoadmap) {
    const newStatus = roadmap.status === "active" ? "backlog" : "active";
    const { error } = await apiFetch(`/api/learning/${roadmap._id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });

    if (error) {
      toast.error(error);
    } else {
      toast.success(newStatus === "active" ? `Activated "${roadmap.title}"` : `Moved to Backlog`);
      loadAllData(true);
    }
  }

  async function handleAddTopicToRoadmap(roadmap: ILearningRoadmap) {
    const topicText = newTopicInputs[roadmap._id]?.trim();
    if (!topicText) return;

    const updatedTopics = [...roadmap.topics, { title: topicText, status: "not_started", subtopics: [] }];
    await apiFetch(`/api/learning/${roadmap._id}`, {
      method: "PATCH",
      body: JSON.stringify({ topics: updatedTopics }),
    });

    setNewTopicInputs((prev) => ({ ...prev, [roadmap._id]: "" }));
    toast.success("Topic added to roadmap!");
    loadAllData(true);
  }

  // --- Goals Handlers ---
  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!goalTitle.trim() || savingGoal) return;

    setSavingGoal(true);
    const { error } = await apiFetch("/api/goals", {
      method: "POST",
      body: JSON.stringify({
        title: goalTitle.trim(),
        description: goalDesc,
        type: goalType,
        parentGoalId: parentGoalId || null,
        progress: 0,
      }),
    });
    setSavingGoal(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Goal milestone created!");
      setIsAddGoalOpen(false);
      setGoalTitle("");
      setGoalDesc("");
      loadAllData(true);
    }
  }

  async function handleDeleteGoal(goalId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm("Delete this goal milestone? Linked tasks will not be deleted.")) return;

    setGoals((prev) => prev.filter((g) => g._id !== goalId));
    const { error } = await apiFetch(`/api/goals/${goalId}`, { method: "DELETE" });
    if (error) {
      toast.error(error);
      loadAllData(true);
    } else {
      toast.info("Goal deleted");
    }
  }

  async function toggleGoalExpand(goalId: string) {
    if (expandedGoalId === goalId) {
      setExpandedGoalId(null);
      return;
    }
    setExpandedGoalId(goalId);

    const { data } = await apiFetch(`/api/goals/${goalId}`);
    if (data?.linkedTasks) {
      setGoalTasks((prev) => ({ ...prev, [goalId]: data.linkedTasks }));
    }
  }

  const displayedRoadmaps = roadmaps.filter((r) => r.status === learningTab);
  const activeRoadmapsCount = roadmaps.filter((r) => r.status === "active").length;

  const typeLabels = {
    long_term: "Vision / Long-Term",
    year: "Annual / 1-Year",
    month: "Quarterly / Month",
    week: "Weekly Objective",
    today: "Daily Milestone",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-display font-bold flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary" />
            Growth & Projects Hub
          </div>
          <h1 className="text-2xl font-display font-extrabold tracking-tight text-foreground">
            Initiatives, Skills & High-Level Horizons
          </h1>
        </div>

        {/* Create Button for current tab */}
        {activeTab === "projects" && (
          <button
            type="button"
            onClick={() => setIsAddProjectOpen(true)}
            className="spider-btn-primary self-start sm:self-auto flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Project</span>
          </button>
        )}
        {activeTab === "learning" && (
          <button
            type="button"
            onClick={() => setIsAddRoadmapOpen(true)}
            className="spider-btn-primary self-start sm:self-auto flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Roadmap</span>
          </button>
        )}
        {activeTab === "goals" && (
          <button
            type="button"
            onClick={() => setIsAddGoalOpen(true)}
            className="spider-btn-primary self-start sm:self-auto flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Goal</span>
          </button>
        )}
      </div>

      {/* Main Unified Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display tracking-wide uppercase transition-all ${
            activeTab === "projects"
              ? "bg-primary text-white shadow-glow-crimson font-bold border border-red-400/40"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 font-semibold"
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Projects</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-card text-foreground border border-border/80 tabular-nums">
            {projects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("learning")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display tracking-wide uppercase transition-all ${
            activeTab === "learning"
              ? "bg-primary text-white shadow-glow-crimson font-bold border border-red-400/40"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 font-semibold"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Learning Skills</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-card text-foreground border border-border/80 tabular-nums">
            {roadmaps.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("goals")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display tracking-wide uppercase transition-all ${
            activeTab === "goals"
              ? "bg-primary text-white shadow-glow-crimson font-bold border border-red-400/40"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 font-semibold"
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Goal Horizons</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-card text-foreground border border-border/80 tabular-nums">
            {goals.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PROJECTS */}
      {/* ========================================================= */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          {loadingProjects ? (
            <div className="py-20 text-center text-xs text-muted-foreground">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="spider-card p-10 text-center space-y-2.5">
              <FolderKanban className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-display font-bold text-foreground">No projects defined yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create a project (e.g. Mars Rover, Portfolio, Client Work) to cluster and track actionable tasks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => {
                const stats = proj.taskStats || { total: 0, completed: 0, pending: 0 };
                const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                const isExpanded = expandedProjectId === proj._id;
                const tasksInProject = projectTasks[proj._id] || [];

                return (
                  <div
                    key={proj._id}
                    className="spider-card p-5 space-y-3.5 hover:border-primary/50 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border/70">
                            {proj.category}
                          </span>
                          {proj.deadline && (
                            <span className="text-[10px] text-amber-400 font-display font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due {formatDateLabel(proj.deadline)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProject(proj._id, e)}
                            className="p-1.5 rounded-lg hover:bg-secondary hover:text-red-400 transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-display font-bold text-foreground leading-snug">
                        {proj.name}
                      </h3>

                      {proj.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {proj.description}
                        </p>
                      )}

                      {/* Progress bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {stats.completed} of {stats.total} tasks completed
                          </span>
                          <span className="font-display font-bold tabular-nums text-primary text-xs">
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300 shadow-glow-crimson-sm"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions & Tasks Expander */}
                    <div className="pt-2 border-t border-border/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleProjectExpand(proj._id)}
                          className="text-[11px] font-display font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>{isExpanded ? "Hide Tasks" : `View Tasks (${stats.total})`}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenTaskModal({ projectId: proj._id, category: proj.category })}
                          className="spider-btn-primary spider-btn-sm text-[11px] py-1 px-2.5 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>Add Task</span>
                        </button>
                      </div>

                      {/* Expanded Task List */}
                      {isExpanded && (
                        <div className="space-y-1.5 pt-2 border-t border-border/50 max-h-48 overflow-y-auto">
                          {tasksInProject.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-1 text-center">
                              No tasks linked yet. Click "+ Add Task" to assign work here.
                            </p>
                          ) : (
                            tasksInProject.map((t) => (
                              <div
                                key={t._id}
                                className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border/50 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <CheckCircle2
                                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                                      t.status === "completed" ? "text-emerald-400" : "text-muted-foreground"
                                    }`}
                                  />
                                  <span className={`truncate font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                    {t.title}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onStartFocus(t)}
                                  className="text-[10px] text-primary hover:underline flex-shrink-0 font-semibold ml-2"
                                >
                                  Focus →
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: LEARNING SKILLS */}
      {/* ========================================================= */}
      {activeTab === "learning" && (
        <div className="space-y-4">
          {/* Active vs Backlog control */}
          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setLearningTab("active")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                learningTab === "active"
                  ? "bg-primary text-white shadow-glow-crimson font-bold border border-red-400/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              <span>Active Skills</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-card text-foreground font-display tabular-nums font-bold">
                {activeRoadmapsCount}/3
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLearningTab("backlog")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                learningTab === "backlog"
                  ? "bg-primary text-white shadow-glow-crimson font-bold border border-red-400/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              <span>Skill Backlog</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-secondary text-muted-foreground font-display tabular-nums">
                {roadmaps.filter((r) => r.status === "backlog").length}
              </span>
            </button>

            <span className="ml-auto text-[11px] text-muted-foreground hidden sm:inline-block">
              WIP limit (max 3 active) destroys tutorial hell.
            </span>
          </div>

          {loadingLearning ? (
            <div className="py-20 text-center text-xs text-muted-foreground">Loading curriculum...</div>
          ) : displayedRoadmaps.length === 0 ? (
            <div className="spider-card p-10 text-center space-y-2.5">
              <Compass className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-display font-bold text-foreground">
                {learningTab === "active" ? "No active roadmaps" : "No roadmaps in backlog"}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {learningTab === "active"
                  ? "Activate a skill from your Backlog or click '+ New Roadmap' to start learning."
                  : "Future aspirations stay organized here until you are ready."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedRoadmaps.map((rm) => (
                <div key={rm._id} className="spider-card p-5 space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border/70">
                          {rm.category}
                        </span>
                        <span className="text-xs font-display font-bold tabular-nums text-primary">
                          {rm.progress}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleRoadmapStatus(rm)}
                          className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {rm.status === "active" ? "Move to Backlog" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteRoadmap(rm._id, e)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-secondary transition-colors"
                          title="Delete Roadmap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-display font-bold text-foreground leading-snug">
                      {rm.title}
                    </h3>

                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 shadow-glow-crimson-sm"
                        style={{ width: `${rm.progress}%` }}
                      />
                    </div>

                    {/* Topics Tree */}
                    <div className="space-y-2.5 pt-2 border-t border-border/70">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                        Mastery Curriculum
                      </div>

                      <div className="space-y-2">
                        {rm.topics.map((topic, tIdx) => {
                          const isComplete = topic.status === "completed";
                          return (
                            <div key={tIdx} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-semibold p-1.5 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                  {isComplete ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                  )}
                                  <span className={isComplete ? "line-through text-muted-foreground" : "text-foreground truncate"}>
                                    {topic.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onStartFocus({
                                        title: `Study: ${topic.title} (${rm.title})`,
                                        category: rm.category || "Learning",
                                        estimatedMinutes: 45,
                                      })
                                    }
                                    className="p-1 rounded bg-primary/15 text-primary hover:bg-primary hover:text-white transition-all text-[10px] font-semibold"
                                    title="Start Focus Timer on this topic"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onOpenTaskModal({
                                        title: `Mastery: ${topic.title}`,
                                        category: "Learning",
                                      })
                                    }
                                    className="text-[10px] text-muted-foreground hover:text-foreground font-semibold px-1"
                                    title="Add as daily task"
                                  >
                                    + Task
                                  </button>
                                </div>
                              </div>

                              {/* Subtopics checklist */}
                              {topic.subtopics && topic.subtopics.length > 0 && (
                                <div className="ml-5 space-y-1 pl-2 border-l border-border/80">
                                  {topic.subtopics.map((sub, sIdx) => (
                                    <div
                                      key={sIdx}
                                      onClick={() => handleToggleSubtopic(rm._id, tIdx, sIdx, sub.completed)}
                                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5"
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

                      {/* Inline Add Topic Input */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          placeholder="Add topic (e.g. Nav2 Behavior Trees)..."
                          value={newTopicInputs[rm._id] || ""}
                          onChange={(e) =>
                            setNewTopicInputs({ ...newTopicInputs, [rm._id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTopicToRoadmap(rm);
                            }
                          }}
                          className="flex-1 px-2.5 py-1 text-xs bg-secondary/50 border border-border/80 rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTopicToRoadmap(rm)}
                          className="px-2.5 py-1 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors border border-border/80"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: GOALS HIERARCHY */}
      {/* ========================================================= */}
      {activeTab === "goals" && (
        <div className="space-y-6">
          {loadingGoals ? (
            <div className="py-20 text-center text-xs text-muted-foreground">Loading goal hierarchy...</div>
          ) : goals.length === 0 ? (
            <div className="spider-card p-10 text-center space-y-2.5">
              <Target className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-display font-bold text-foreground">No goals defined yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Define a high-level vision or annual target to give purpose to your daily tasks.
              </p>
            </div>
          ) : (
            ["long_term", "year", "month", "week", "today"].map((tier) => {
              const tierGoals = goals.filter((g) => g.type === tier);
              if (tierGoals.length === 0) return null;

              return (
                <div key={tier} className="space-y-3">
                  <h3 className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
                    {typeLabels[tier as keyof typeof typeLabels]}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tierGoals.map((goal) => {
                      const isExpanded = expandedGoalId === goal._id;
                      const linkedTasks = goalTasks[goal._id] || [];

                      return (
                        <div
                          key={goal._id}
                          className="spider-card p-5 space-y-3 hover:border-primary/50 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border/70">
                                {tier.replace("_", " ")}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="font-display tabular-nums text-xs font-bold text-primary mr-1">
                                  {goal.progress}%
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteGoal(goal._id, e)}
                                  className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-secondary transition-colors"
                                  title="Delete Goal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h4 className="text-base font-display font-bold text-foreground leading-snug">
                              {goal.title}
                            </h4>

                            {goal.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {goal.description}
                              </p>
                            )}

                            <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300 shadow-glow-crimson-sm"
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Goal Linked Tasks Expander & Add Task */}
                          <div className="pt-2 border-t border-border/70 space-y-2">
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => toggleGoalExpand(goal._id)}
                                className="text-[11px] font-display font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                <span>{isExpanded ? "Hide Tasks" : `Linked Tasks (${goal.linkedTasksCount || 0})`}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenTaskModal({ goalId: goal._id })}
                                className="spider-btn-primary spider-btn-sm text-[11px] py-1 px-2.5 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                                <span>Add Task</span>
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="space-y-1.5 pt-2 border-t border-border/50 max-h-48 overflow-y-auto">
                                {linkedTasks.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic py-1 text-center">
                                    No tasks linked yet. Click "+ Add Task" to align actions with this goal.
                                  </p>
                                ) : (
                                  linkedTasks.map((t) => (
                                    <div
                                      key={t._id}
                                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border/50 text-xs"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <CheckCircle2
                                          className={`w-3.5 h-3.5 flex-shrink-0 ${
                                            t.status === "completed" ? "text-emerald-400" : "text-muted-foreground"
                                          }`}
                                        />
                                        <span className={`truncate font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                          {t.title}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => onStartFocus(t)}
                                        className="text-[10px] text-primary hover:underline flex-shrink-0 font-semibold ml-2"
                                      >
                                        Focus →
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE PROJECT */}
      {/* ========================================================= */}
      {isAddProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-2xl glass-panel animate-scaleIn">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground">Create Project</h3>
              <button
                onClick={() => setIsAddProjectOpen(false)}
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
                  placeholder="e.g. Mars Rover Autonomous Navigation"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Category</label>
                  <select
                    value={projectCategory}
                    onChange={(e) => setProjectCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none"
                  >
                    <option value="Rover">Rover</option>
                    <option value="Career">Career</option>
                    <option value="Business">Business</option>
                    <option value="University">University</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={projectDeadline}
                    onChange={(e) => setProjectDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Goals, specs, scope..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setIsAddProjectOpen(false)}
                  className="spider-btn-secondary spider-btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProject}
                  className="spider-btn-primary spider-btn-sm flex items-center gap-1.5"
                >
                  {savingProject ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderKanban className="w-3.5 h-3.5" />}
                  <span>Create Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE ROADMAP */}
      {/* ========================================================= */}
      {isAddRoadmapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-2xl glass-panel animate-scaleIn">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground">Create Learning Roadmap</h3>
              <button
                onClick={() => setIsAddRoadmapOpen(false)}
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
                  value={newRoadmapTitle}
                  onChange={(e) => setNewRoadmapTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Category</label>
                <select
                  value={newRoadmapCategory}
                  onChange={(e) => setNewRoadmapCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Robotics">Robotics</option>
                  <option value="Embedded">Embedded</option>
                  <option value="AI / ML">AI / ML</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Curriculum Topics (One per line)
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g.&#10;Nodes & Topics&#10;TF2 Transforms&#10;Nav2 Costmaps&#10;Behavior Trees"
                  value={newTopicString}
                  onChange={(e) => setNewTopicString(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setIsAddRoadmapOpen(false)}
                  className="spider-btn-secondary spider-btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRoadmap}
                  className="spider-btn-primary spider-btn-sm flex items-center gap-1.5"
                >
                  {savingRoadmap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                  <span>Create Roadmap</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE GOAL */}
      {/* ========================================================= */}
      {isAddGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-2xl glass-panel animate-scaleIn">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground">Create Goal Horizon</h3>
              <button
                onClick={() => setIsAddGoalOpen(false)}
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
                  placeholder="e.g. Master Autonomous Robotic Mapping"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Horizon Level</label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as any)}
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
                  <label className="block font-semibold text-muted-foreground mb-1">Parent Goal Alignment</label>
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
                  placeholder="Success criteria, why it matters..."
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary/50 border border-border/80 rounded-xl text-foreground focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setIsAddGoalOpen(false)}
                  className="spider-btn-secondary spider-btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGoal}
                  className="spider-btn-primary spider-btn-sm flex items-center gap-1.5"
                >
                  {savingGoal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
                  <span>Create Goal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
