"use client";

import React, { useState } from "react";
import { Brain, Sparkles, Check, Trash2, Loader2, Plus, X } from "lucide-react";
import { useApi } from "@/lib/api/useApi";
import { toast } from "sonner";
import { TaskCategory, TaskPriority } from "@/types";
import { SpiderLogo } from "@/components/icons/SpiderLogo";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl spider-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-rose-700 text-white flex items-center justify-center shadow-glow-crimson-sm border border-red-400/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-foreground">Brain Dump Engine</h2>
              <p className="text-xs text-muted-foreground">
                Paste unfiltered notes or stream of consciousness to auto-extract structured tasks.
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
              placeholder="Dump thoughts here (e.g. 'Fix rover telemetry tomorrow 30m, study OSI model tonight, prepare review slides')..."
              className="w-full p-3.5 bg-secondary/50 border border-border/80 rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/60 focus:border-primary/60 resize-none font-sans leading-relaxed"
            />

            <div className="flex justify-between items-center mt-2.5">
              <span className="text-[11px] text-muted-foreground font-display">
                Multi-line or comma-separated actions detected automatically.
              </span>
              <button
                type="button"
                onClick={handleParse}
                disabled={!rawText.trim() || parsing}
                className="spider-btn-primary spider-btn-sm disabled:opacity-40"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing Structure...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract Tasks</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extracted Candidates Preview */}
          {candidates.length > 0 && (
            <div className="space-y-2.5 pt-3 border-t border-border/80">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Extracted Candidates ({candidates.length}) — Review & Confirm
                </h3>
                <button
                  type="button"
                  onClick={addCandidate}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" /> Add item
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {candidates.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-secondary/40 border border-border/80 rounded-xl flex flex-col md:flex-row md:items-center gap-2.5 text-xs shadow-2xs hover:border-primary/40 transition-colors"
                  >
                    <input
                      type="text"
                      value={c.title}
                      onChange={(e) => updateCandidate(idx, "title", e.target.value)}
                      className="flex-1 bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-foreground font-semibold px-1"
                    />

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={c.category}
                        onChange={(e) => updateCandidate(idx, "category", e.target.value)}
                        className="bg-card border border-border/80 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
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
                        className="bg-card border border-border/80 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-display tabular-nums">
                        <input
                          type="number"
                          value={c.estimatedMinutes}
                          onChange={(e) =>
                            updateCandidate(idx, "estimatedMinutes", parseInt(e.target.value, 10) || 15)
                          }
                          className="w-12 bg-card border border-border/80 rounded-lg px-1.5 py-1 text-xs text-center text-foreground focus:outline-none"
                        />
                        <span>min</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCandidate(idx)}
                        className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-card transition-colors ml-auto"
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
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-border/80 bg-secondary/20">
          <button
            type="button"
            onClick={onClose}
            className="spider-btn-secondary spider-btn-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={candidates.length === 0 || saving}
            onClick={handleSaveAll}
            className="spider-btn-primary spider-btn-sm disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>Save {candidates.length} Task{candidates.length === 1 ? "" : "s"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
