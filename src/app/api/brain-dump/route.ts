import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { parseBrainDumpText, ParsedTaskCandidate } from "@/lib/engine/brainDumpParser";
import { aiProvider } from "@/lib/ai/aiProvider";

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const { rawText } = await req.json();
    if (!rawText || typeof rawText !== "string") {
      return NextResponse.json({ error: "rawText is required" }, { status: 400 });
    }

    // Attempt AI extraction if available, fallback to deterministic parser
    let candidates: ParsedTaskCandidate[] = [];
    if (aiProvider.isAvailable()) {
      candidates = await aiProvider.parseBrainDump(rawText);
    }

    if (!candidates || candidates.length === 0) {
      candidates = parseBrainDumpText(rawText);
    }

    return NextResponse.json({ candidates });
  } catch (err: any) {
    console.error("POST /api/brain-dump error:", err);
    return NextResponse.json({ error: err.message || "Failed to parse brain dump" }, { status: 500 });
  }
}
