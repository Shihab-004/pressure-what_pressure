"use client";

import React, { useState } from "react";
import { Brain, Sparkles, Check, Trash2, Loader2, Plus, X } from "lucide-react";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { TaskCategory, TaskPriority } from "@/types";

interface BrainDumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface CandidateRow {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedMinutes: number;
  deadline?: string;
}

export function BrainDumpModal({ isOpen, onClose, onSaved }: BrainDumpModalProps) {
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const { apiFetch } = useApi();

  if (!isOpen) return null;

  async function handleParse() {
    if (!rawText.trim()) return;
    setParsing(true);

    const { data, error } = await apiFetch("/api/brain-dump", {
      method: "POST",
      body: JSON.stringify({ rawText }),
    });

    setParsing(false);

    if (error) {
      toast.error(error);
    } else if (data?.candidates) {
      setCandidates(data.candidates);
      toast.success(`Extracted ${data.candidates.length} structured tasks!`);
    }
  }

  function updateCandidate(index: number, field: keyof CandidateRow, value: any) {
    const updated = [...candidates];
    updated[index] = { ...updated[index], [field]: value };
    setCandidates(updated);
  }

  function removeCandidate(index: number) {
    setCandidates(candidates.filter((_, i) => i !== index));
  }

  function addCandidate() {
    setCandidates([
      ...candidates,
      {
        title: "New Item",
        category: "Personal",
        priority: "medium",
        estimatedMinutes: 45,
      },
    ]);
  }

  async function handleSaveAll() {
    if (candidates.length === 0) return;
    setSaving(true);

    const { error } = await apiFetch("/api/brain-dump/save", {
      method: "POST",
      body: JSON.stringify({ tasks: candidates }),
    });

    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(`Saved ${candidates.length} tasks to your Workspace!`);
      setCandidates([]);
      setRawText("");
      onSaved();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Brain Dump → Structured Tasks</h2>
              <p className="text-xs text-muted-foreground">
                Type or paste unstructured thoughts, notes, or mixed Bengali/English sentences.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. কালকে MTE lab আছে, OSI assignment শেষ করতে হবে, Rover admin bug fix করতে হবে, AWS IoT শুরু করতে চাই..."
              className="w-full p-3 bg-secondary/50 border border-border/80 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 focus:border-primary/60 resize-none font-sans"
            />

            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                Multi-line, comma-separated, or bulleted ideas.
              </span>
              <button
                type="button"
                onClick={handleParse}
                disabled={!rawText.trim() || parsing}
                className="px-3.5 py-1.5 bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-foreground border border-border/80 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Structure Tasks
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extracted Candidates Preview */}
          {candidates.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Extracted Tasks ({candidates.length}) — Review & Confirm
                </h3>
                <button
                  type="button"
                  onClick={addCandidate}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add item
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {candidates.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-secondary/40 border border-border/60 rounded-lg flex flex-col md:flex-row md:items-center gap-2.5 text-sm"
                  >
                    <input
                      type="text"
                      value={c.title}
                      onChange={(e) => updateCandidate(idx, "title", e.target.value)}
                      className="flex-1 bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-foreground font-medium text-xs md:text-sm px-1"
                    />

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={c.category}
                        onChange={(e) => updateCandidate(idx, "category", e.target.value)}
                        className="bg-card border border-border/80 rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option value="University">University</option>
                        <option value="Rover">Rover</option>
                        <option value="Learning">Learning</option>
                        <option value="Career">Career</option>
                        <option value="Business">Business</option>
                        <option value="Personal">Personal</option>
                      </select>

                      <select
                        value={c.priority}
                        onChange={(e) => updateCandidate(idx, "priority", e.target.value)}
                        className="bg-card border border-border/80 rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input
                          type="number"
                          value={c.estimatedMinutes}
                          onChange={(e) =>
                            updateCandidate(idx, "estimatedMinutes", parseInt(e.target.value, 10) || 15)
                          }
                          className="w-12 bg-card border border-border/80 rounded px-1.5 py-1 text-xs text-center text-foreground focus:outline-none"
                        />
                        <span>min</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCandidate(idx)}
                        className="p-1 text-muted-foreground hover:text-red-400 rounded transition-colors ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-border bg-card/80">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={candidates.length === 0 || saving}
            onClick={handleSaveAll}
            className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Save {candidates.length} Task{candidates.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}
