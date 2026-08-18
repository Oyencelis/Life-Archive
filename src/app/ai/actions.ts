"use server";

import { requireSession } from "@/lib/require-session";
import { retrieveContext } from "@/lib/ai/retrieval";
import { buildContext } from "@/lib/ai/context";
import { getAIProvider } from "@/lib/ai/provider";
import type { CitedRecord } from "@/lib/ai/types";

export interface AskResult {
  answer: string;
  citations: CitedRecord[];
  grounded: boolean;
}

export async function askArchive(question: string): Promise<AskResult | { error: string }> {
  const session = await requireSession();
  const trimmed = question.trim();
  if (!trimmed) return { error: "Ask something first." };

  const provider = getAIProvider();
  if (!provider) {
    return {
      error: "No AI provider is configured yet — add GEMINI_API_KEY to your environment to enable this.",
    };
  }

  const records = await retrieveContext(session.user.id, trimmed);
  const context = buildContext(records);

  try {
    const result = await provider.complete(trimmed, context);
    return { answer: result.text, citations: context.records, grounded: records.length > 0 };
  } catch {
    return { error: "The AI provider didn't respond. Try again in a moment." };
  }
}
