import { TaskCategory, TaskPriority } from "@/types";

export interface ParsedTaskCandidate {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedMinutes: number;
  deadline?: string;
  notes?: string;
}

/**
 * Intelligent deterministic parser for Quick Add single lines and Brain Dump multiline text.
 * Detects keywords (University, Lab, Rover, ROS2, Exam, Quiz, Bug, etc.),
 * time durations (e.g. 1 hour, 45m, 30 min), and deadlines (tomorrow, tonight, next monday).
 */
export function parseSingleQuickAdd(input: string): ParsedTaskCandidate {
  let text = input.trim();
  let category: TaskCategory = "Personal";
  let priority: TaskPriority = "medium";
  let estimatedMinutes = 45;
  let deadline: string | undefined = undefined;

  const lower = text.toLowerCase();

  // 1. Category Detection
  if (
    lower.includes("mte") ||
    lower.includes("lab") ||
    lower.includes("assignment") ||
    lower.includes("exam") ||
    lower.includes("quiz") ||
    lower.includes("class") ||
    lower.includes("uni") ||
    lower.includes("course") ||
    lower.includes("report") ||
    lower.includes("osi")
  ) {
    category = "University";
  } else if (
    lower.includes("rover") ||
    lower.includes("sensor") ||
    lower.includes("motor") ||
    lower.includes("esp32") ||
    lower.includes("stm32") ||
    lower.includes("robot") ||
    lower.includes("admin bug") ||
    lower.includes("hardware")
  ) {
    category = "Rover";
  } else if (
    lower.includes("ros2") ||
    lower.includes("learn") ||
    lower.includes("study") ||
    lower.includes("tutorial") ||
    lower.includes("aws iot") ||
    lower.includes("course") ||
    lower.includes("read")
  ) {
    category = "Learning";
  } else if (
    lower.includes("resume") ||
    lower.includes("interview") ||
    lower.includes("career") ||
    lower.includes("apply") ||
    lower.includes("job")
  ) {
    category = "Career";
  } else if (
    lower.includes("client") ||
    lower.includes("invoice") ||
    lower.includes("business") ||
    lower.includes("pitch")
  ) {
    category = "Business";
  }

  // 2. Priority Detection
  if (
    lower.includes("urgent") ||
    lower.includes("critical") ||
    lower.includes("asap") ||
    lower.includes("emergency")
  ) {
    priority = "critical";
  } else if (
    lower.includes("important") ||
    lower.includes("high priority") ||
    lower.includes("must finish") ||
    lower.includes("শেষ করতে হবে")
  ) {
    priority = "high";
  }

  // 3. Duration Detection (e.g., "1 hour", "1.5h", "90 min", "45m", "30 mins")
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  if (hourMatch) {
    estimatedMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
  } else {
    const minMatch = text.match(/(\d+)\s*(?:minutes?|mins?|m)\b/i);
    if (minMatch) {
      estimatedMinutes = parseInt(minMatch[1], 10);
    }
  }

  // 4. Deadline Detection (tomorrow, tonight, next week, dates, bengali "কালকে")
  const today = new Date();
  if (lower.includes("tomorrow") || lower.includes("কালকে")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    if (lower.includes("8 pm") || lower.includes("8pm")) {
      d.setHours(20, 0, 0, 0);
    } else {
      d.setHours(23, 59, 0, 0);
    }
    deadline = d.toISOString();
  } else if (lower.includes("tonight") || lower.includes("আজকে রাতে") || lower.includes("today")) {
    const d = new Date(today);
    d.setHours(22, 0, 0, 0);
    deadline = d.toISOString();
  }

  // 5. Clean Title: strip trailing duration/time annotations for clarity
  let cleanTitle = text
    .replace(/,\s*\d+\s*(?:hours?|hrs?|h|minutes?|mins?|m)\b/i, "")
    .replace(/\b(?:tomorrow\s*(?:8\s*pm|evening)?|tonight|today)\b/i, "")
    .replace(/\b(?:urgent|asap)\b/i, "")
    .replace(/,\s*$/, "")
    .trim();

  // Capitalize first letter
  if (cleanTitle.length > 0) {
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  }

  return {
    title: cleanTitle || text,
    category,
    priority,
    estimatedMinutes,
    deadline,
  };
}

/**
 * Parses multi-sentence, bulleted, or comma-separated Brain Dump input.
 * Supports English and Bengali phrasing.
 */
export function parseBrainDumpText(rawText: string): ParsedTaskCandidate[] {
  // Split by newlines, bullets, or punctuation like semicolons / commas when clearly separating clauses
  const lines = rawText
    .split(/\n|;|।|•|-|\*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const results: ParsedTaskCandidate[] = [];

  for (const line of lines) {
    // If line has comma-separated clauses with verbs or subjects
    if (line.includes(",") && line.length > 30) {
      const parts = line.split(",").map((p) => p.trim()).filter((p) => p.length > 2);
      for (const part of parts) {
        results.push(parseSingleQuickAdd(part));
      }
    } else {
      results.push(parseSingleQuickAdd(line));
    }
  }

  return results;
}
