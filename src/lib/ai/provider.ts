import type { AIProvider } from "./types";
import { GeminiProvider } from "./providers/gemini";

// Swap the provider here (or branch on an env var) to change models without
// touching retrieval, the context assembler, or the UI.
export function getAIProvider(): AIProvider | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GeminiProvider(apiKey);
}
