// One-off backfill for records created before semantic search existed.
// Safe to re-run — upsertEmbedding overwrites by (entityType, entityId).
import { PrismaClient } from "@prisma/client";
import { upsertEmbedding, memoryEmbeddingText, journalEmbeddingText, writingEmbeddingText } from "../src/lib/ai/embeddings";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY isn't set — nothing to backfill.");
    process.exit(1);
  }

  const [memories, journalEntries, writings] = await Promise.all([
    prisma.memory.findMany({ where: { archivedAt: null } }),
    prisma.journalEntry.findMany(),
    prisma.writing.findMany(),
  ]);

  let done = 0;
  const total = memories.length + journalEntries.length + writings.length;

  for (const m of memories) {
    await upsertEmbedding(m.userId, "memory", m.id, memoryEmbeddingText(m));
    done += 1;
    console.log(`[${done}/${total}] memory ${m.id}`);
  }
  for (const j of journalEntries) {
    await upsertEmbedding(j.userId, "journal", j.id, journalEmbeddingText(j));
    done += 1;
    console.log(`[${done}/${total}] journal ${j.id}`);
  }
  for (const w of writings) {
    await upsertEmbedding(w.userId, "writing", w.id, writingEmbeddingText(w));
    done += 1;
    console.log(`[${done}/${total}] writing ${w.id}`);
  }

  console.log(`Backfilled ${done} embeddings.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
