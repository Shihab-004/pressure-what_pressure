import { ParsedTaskCandidate } from "../engine/brainDumpParser";

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  parseBrainDump(rawText: string): Promise<ParsedTaskCandidate[]>;
  decomposeTask(taskTitle: string, context?: string): Promise<string[]>;
  generateWeeklySummary(stats: {
    planned: number;
    completed: number;
    focusMinutes: number;
    categories: Record<string, number>;
  }): Promise<string>;
}

/**
 * Native Gemini Provider implementation using standard fetch to Google Gemini API
 */
export class GeminiAIProvider implements AIProvider {
  name = "Google Gemini";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async parseBrainDump(rawText: string): Promise<ParsedTaskCandidate[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const prompt = `You are a productivity task extractor. Extract structured tasks from this user brain dump text:
"${rawText}"

Return JSON ONLY as an array of objects matching:
[
  {
    "title": "Clear task title",
    "category": "University" | "Rover" | "Learning" | "Career" | "Business" | "Personal",
    "priority": "low" | "medium" | "high" | "critical",
    "estimatedMinutes": number (default 45),
    "deadline": ISO string or null
  }
]`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!contentText) return [];

      return JSON.parse(contentText);
    } catch (err) {
      console.warn("AI parseBrainDump failed, falling back to local engine:", err);
      return [];
    }
  }

  async decomposeTask(taskTitle: string, context?: string): Promise<string[]> {
    if (!this.isAvailable()) return [];

    try {
      const prompt = `Decompose this task into 3-5 concrete actionable subtasks:
Task: "${taskTitle}"
${context ? `Context: ${context}` : ""}

Return JSON ONLY as an array of strings: ["Subtask 1", "Subtask 2", ...]`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return contentText ? JSON.parse(contentText) : [];
    } catch {
      return [];
    }
  }

  async generateWeeklySummary(stats: {
    planned: number;
    completed: number;
    focusMinutes: number;
    categories: Record<string, number>;
  }): Promise<string> {
    if (!this.isAvailable()) return "";

    try {
      const prompt = `Write a concise 2-sentence executive summary of the user's week based on these numbers:
Tasks planned: ${stats.planned}, Completed: ${stats.completed}, Focus time: ${Math.round(
        stats.focusMinutes / 60
      )} hours. Categories: ${JSON.stringify(stats.categories)}.
Keep it factual, encouraging, and clear.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) return "";
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch {
      return "";
    }
  }
}

export const aiProvider: AIProvider = new GeminiAIProvider();
