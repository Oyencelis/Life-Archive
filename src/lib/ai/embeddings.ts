import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// text-embedding-004 (the model named in the SDK's own docstring example)
// isn't available on this API key's project — gemini-embedding-001 is the
// current stable Developer API embedding model. It defaults to 3072 dims,
// so outputDimensionality must be pinned to match the vector(768) column.
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMS = 768;

// Values come only from the Gemini embedding response (floats), never from
// user input, so splicing them into raw SQL below is safe — nothing here
// can contain a quote or semicolon.
function vectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

// Returns null (never throws) when GEMINI_API_KEY isn't set or the call
// fails — callers treat embeddings as a best-effort enhancement, same as
// the rest of the AI layer when unconfigured.
export async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  const trimmed = text.trim();
  if (!apiKey || !trimmed) return null;

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: trimmed.slice(0, 8000),
      config: { outputDimensionality: EMBEDDING_DIMS },
    });
    return response.embeddings?.[0]?.values ?? null;
  } catch (error) {
    console.error("Embedding request failed:", error);
    return null;
  }
}

export async function upsertEmbedding(
  userId: string,
  entityType: string,
  entityId: string,
  content: string
): Promise<void> {
  const values = await embedText(content);
  if (!values) return;

  const vectorParam = Prisma.raw(`'${vectorLiteral(values)}'::vector`);
  const id = crypto.randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "Embedding" ("id", "userId", "entityType", "entityId", "content", "vector", "createdAt", "updatedAt")
    VALUES (${id}, ${userId}, ${entityType}, ${entityId}, ${content}, ${vectorParam}, now(), now())
    ON CONFLICT ("entityType", "entityId")
    DO UPDATE SET "content" = EXCLUDED."content", "vector" = EXCLUDED."vector", "updatedAt" = now()
  `;
}

export async function deleteEmbedding(entityType: string, entityId: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "Embedding" WHERE "entityType" = ${entityType} AND "entityId" = ${entityId}`;
}

export interface SemanticMatch {
  entityType: string;
  entityId: string;
  content: string;
  distance: number;
}

// Cosine distance (pgvector's <=>) — lower is more similar. Returns [] when
// Gemini isn't configured, so callers can merge this in unconditionally.
export async function semanticSearch(
  userId: string,
  queryText: string,
  limit = 12
): Promise<SemanticMatch[]> {
  const values = await embedText(queryText);
  if (!values) return [];

  const vectorParam = Prisma.raw(`'${vectorLiteral(values)}'::vector`);
  return prisma.$queryRaw<SemanticMatch[]>`
    SELECT "entityType", "entityId", "content", ("vector" <=> ${vectorParam}) AS distance
    FROM "Embedding"
    WHERE "userId" = ${userId}
    ORDER BY "vector" <=> ${vectorParam}
    LIMIT ${limit}
  `;
}

export function memoryEmbeddingText(m: { title: string; description?: string | null }): string {
  return [m.title, m.description].filter(Boolean).join("\n");
}

export function journalEmbeddingText(j: { title?: string | null; content: string }): string {
  return [j.title, j.content].filter(Boolean).join("\n");
}

export function writingEmbeddingText(w: { title?: string | null; content: string }): string {
  return [w.title, w.content].filter(Boolean).join("\n");
}
