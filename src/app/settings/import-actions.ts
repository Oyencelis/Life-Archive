"use server";

import { revalidatePath } from "next/cache";
import { RelationshipStatus } from "@prisma/client";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { parseCsvRecords } from "@/lib/csv";
import { upsertEmbedding, journalEmbeddingText } from "@/lib/ai/embeddings";

export interface ImportResult {
  error?: string;
  imported?: number;
  skipped?: number;
}

function firstOf(record: Record<string, string>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (record[key]) return record[key];
  }
  return undefined;
}

// Expected columns (case-insensitive-ish via firstOf's alt lookups): date,
// title, content, mood. Any row missing content is skipped, not failed —
// a big pasted-together export file is expected to have some blank rows.
export async function importJournalCsv(
  _prevState: ImportResult | undefined,
  formData: FormData
): Promise<ImportResult> {
  const session = await requireSession();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file selected" };

  const records = parseCsvRecords(await file.text());
  if (records.length === 0) return { error: "No rows found in that file" };

  let imported = 0;
  let skipped = 0;
  for (const record of records) {
    const content = firstOf(record, "content", "Content", "entry", "Entry");
    if (!content) {
      skipped += 1;
      continue;
    }
    const dateRaw = firstOf(record, "date", "Date", "occurredAt");
    const occurredAt = dateRaw && !Number.isNaN(Date.parse(dateRaw)) ? new Date(dateRaw) : new Date();

    const entry = await prisma.journalEntry.create({
      data: {
        userId: session.user.id,
        title: firstOf(record, "title", "Title") || null,
        content,
        occurredAt,
        mood: firstOf(record, "mood", "Mood") || null,
      },
    });
    await upsertEmbedding(session.user.id, "journal", entry.id, journalEmbeddingText(entry));
    imported += 1;
  }

  revalidatePath("/journal");
  return { imported, skipped };
}

const VALID_STATUS = new Set<string>(Object.values(RelationshipStatus));

// Expected columns: name, category, relationshipStatus, nickname, bio, notes
export async function importPeopleCsv(
  _prevState: ImportResult | undefined,
  formData: FormData
): Promise<ImportResult> {
  const session = await requireSession();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file selected" };

  const records = parseCsvRecords(await file.text());
  if (records.length === 0) return { error: "No rows found in that file" };

  let imported = 0;
  let skipped = 0;
  for (const record of records) {
    const name = firstOf(record, "name", "Name");
    if (!name) {
      skipped += 1;
      continue;
    }
    const statusRaw = (firstOf(record, "relationshipStatus", "status", "Status") ?? "").toUpperCase();

    await prisma.person.create({
      data: {
        userId: session.user.id,
        name,
        category: firstOf(record, "category", "Category") || "acquaintance",
        nickname: firstOf(record, "nickname", "Nickname") || null,
        relationshipStatus: VALID_STATUS.has(statusRaw) ? (statusRaw as RelationshipStatus) : null,
        bio: firstOf(record, "bio", "Bio") || null,
        notes: firstOf(record, "notes", "Notes") || null,
      },
    });
    imported += 1;
  }

  revalidatePath("/people");
  return { imported, skipped };
}
