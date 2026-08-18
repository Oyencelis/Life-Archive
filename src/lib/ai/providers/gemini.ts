import { GoogleGenAI } from "@google/genai";
import type { AIProvider, GroundedContext } from "../types";

const SYSTEM_PROMPT = `You are the personal AI assistant built into a private, single-user life archive application. Your entire job is to answer questions using ONLY the archive context supplied with each question.

Rules, no exceptions:
- Answer strictly from the "ARCHIVE CONTEXT" block. Never use outside knowledge, never guess, never invent details, never browse the internet.
- If the context is empty or doesn't contain enough to answer, say plainly that the information isn't in the archive yet. Do not speculate about what might be true.
- Write in second person, addressing the archive's owner directly ("you met her in..."), in a warm but concise voice.
- Do not fabricate citations, dates, or names that are not present in the context.
- Keep answers focused — a few sentences unless the question genuinely calls for more.`;

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model ?? process.env.GEMINI_MODEL ?? "gemini-flash-latest";
  }

  async complete(question: string, context: GroundedContext): Promise<{ text: string }> {
    const contents = `ARCHIVE CONTEXT:\n${context.text || "(no matching records were found in the archive)"}\n\nQUESTION:\n${question}`;

    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    return { text: response.text?.trim() || "I couldn't generate a response just now." };
  }
}
