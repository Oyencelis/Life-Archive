import { prisma } from "@/lib/prisma";
import type { GoalStatus, ProjectStatus } from "@prisma/client";
import { semanticSearch } from "./embeddings";

export interface RetrievedRecord {
  type: string;
  id: string;
  label: string;
  href: string;
  snippet: string;
}

const STOPWORDS = new Set([
  "what",
  "when",
  "where",
  "which",
  "who",
  "whom",
  "whose",
  "why",
  "how",
  "did",
  "does",
  "do",
  "doing",
  "done",
  "the",
  "and",
  "or",
  "but",
  "if",
  "then",
  "than",
  "that",
  "this",
  "these",
  "those",
  "is",
  "are",
  "was",
  "were",
  "been",
  "being",
  "be",
  "have",
  "has",
  "had",
  "having",
  "with",
  "from",
  "into",
  "about",
  "onto",
  "upon",
  "over",
  "under",
  "between",
  "during",
  "you",
  "your",
  "yours",
  "my",
  "me",
  "we",
  "our",
  "us",
  "tell",
  "know",
  "think",
  "believe",
  "remember",
  "recall",
  "all",
  "most",
  "some",
  "any",
  "many",
  "much",
  "more",
  "for",
  "of",
  "to",
  "in",
  "on",
  "at",
  "as",
  "it",
  "its",
  "them",
  "their",
]);

function extractTerms(question: string): string[] {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return Array.from(new Set(words)).slice(0, 8);
}

function extractYear(question: string): number | null {
  const match = question.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

const GOAL_STATUS_WORDS: Record<string, GoalStatus> = {
  active: "ACTIVE",
  completed: "COMPLETED",
  paused: "PAUSED",
  abandoned: "ABANDONED",
  replaced: "REPLACED",
};

const PROJECT_STATUS_WORDS: Record<string, ProjectStatus> = {
  active: "ACTIVE",
  completed: "COMPLETED",
  paused: "PAUSED",
  abandoned: "ABANDONED",
  failed: "FAILED",
};

function snippet(text: string | null | undefined, max = 160): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

export async function retrieveContext(userId: string, question: string): Promise<RetrievedRecord[]> {
  const terms = extractTerms(question);
  const year = extractYear(question);
  const goalStatus = terms.map((t) => GOAL_STATUS_WORDS[t]).find(Boolean);
  const projectStatus = terms.map((t) => PROJECT_STATUS_WORDS[t]).find(Boolean);

  const results: RetrievedRecord[] = [];
  const contains = (field: string) =>
    terms.map((t) => ({ [field]: { contains: t, mode: "insensitive" as const } }));

  if (terms.length > 0) {
    const [people, memories, journal, places, events, projects, writings, goals, interests] =
      await Promise.all([
        prisma.person.findMany({
          where: {
            userId,
            archivedAt: null,
            isLocked: false,
            OR: [...contains("name"), ...contains("nickname"), ...contains("bio"), ...contains("notes"), ...contains("category")],
          },
          take: 6,
        }),
        prisma.memory.findMany({
          where: {
            userId,
            archivedAt: null,
            OR: [...contains("title"), ...contains("description"), ...contains("mood")],
          },
          take: 6,
        }),
        prisma.journalEntry.findMany({
          where: { userId, visibility: "PUBLIC", OR: [...contains("title"), ...contains("content")] },
          take: 6,
        }),
        prisma.place.findMany({
          where: { userId, archivedAt: null, OR: [...contains("name"), ...contains("description")] },
          take: 6,
        }),
        prisma.event.findMany({
          where: { userId, archivedAt: null, OR: [...contains("title"), ...contains("description")] },
          take: 6,
        }),
        prisma.project.findMany({
          where: {
            userId,
            archivedAt: null,
            OR: [...contains("name"), ...contains("description"), ...contains("whatILearned")],
          },
          take: 6,
        }),
        prisma.writing.findMany({
          where: { userId, visibility: "PUBLIC", OR: [...contains("title"), ...contains("content")] },
          take: 6,
        }),
        prisma.goal.findMany({
          where: { userId, OR: [...contains("title"), ...contains("description")] },
          take: 6,
        }),
        prisma.interest.findMany({
          where: { userId, OR: [...contains("name"), ...contains("category")] },
          take: 6,
        }),
      ]);

    for (const p of people) {
      results.push({
        type: "person",
        id: p.id,
        label: p.name,
        href: `/people/${p.id}`,
        snippet: `${p.category}${p.relationshipStatus ? ` · ${p.relationshipStatus}` : ""}. ${snippet(p.bio) || snippet(p.notes)}`,
      });
    }
    for (const m of memories) {
      results.push({
        type: "memory",
        id: m.id,
        label: m.title,
        href: `/memories/${m.id}`,
        snippet: `${m.date ? m.date.toISOString().slice(0, 10) : "undated"}. ${snippet(m.description)}`,
      });
    }
    for (const j of journal) {
      results.push({
        type: "journal",
        id: j.id,
        label: j.title ?? j.occurredAt.toISOString().slice(0, 10),
        href: `/journal/${j.id}`,
        snippet: `${j.occurredAt.toISOString().slice(0, 10)}. ${snippet(j.content)}`,
      });
    }
    for (const pl of places) {
      results.push({
        type: "place",
        id: pl.id,
        label: pl.name,
        href: `/places/${pl.id}`,
        snippet: snippet(pl.description) || pl.category || "",
      });
    }
    for (const e of events) {
      results.push({
        type: "event",
        id: e.id,
        label: e.title,
        href: `/events/${e.id}`,
        snippet: `${e.date ? e.date.toISOString().slice(0, 10) : e.category}. ${snippet(e.description)}`,
      });
    }
    for (const pr of projects) {
      results.push({
        type: "project",
        id: pr.id,
        label: pr.name,
        href: `/projects/${pr.id}`,
        snippet: `${pr.status}. ${snippet(pr.description) || snippet(pr.whatILearned)}`,
      });
    }
    for (const w of writings) {
      results.push({
        type: "writing",
        id: w.id,
        label: w.title ?? w.type,
        href: "/writings",
        snippet: `${w.type}. ${snippet(w.content)}`,
      });
    }
    for (const g of goals) {
      results.push({
        type: "goal",
        id: g.id,
        label: g.title,
        href: "/goals",
        snippet: `${g.status}. ${snippet(g.description)}`,
      });
    }
    for (const i of interests) {
      results.push({
        type: "interest",
        id: i.id,
        label: i.name,
        href: "/interests",
        snippet: `${i.status}${i.category ? ` · ${i.category}` : ""}`,
      });
    }
  }

  // Graph expansion: if a term names a real person, pull their memories and
  // relationships too, even when those records never mention the name in text.
  if (terms.length > 0) {
    const namedPeople = await prisma.person.findMany({
      where: {
        userId,
        archivedAt: null,
        isLocked: false,
        OR: terms.map((t) => ({ name: { contains: t, mode: "insensitive" as const } })),
      },
      take: 3,
    });

    for (const person of namedPeople) {
      const [links, relFrom, relTo] = await Promise.all([
        prisma.entityPerson.findMany({
          where: { personId: person.id, entityType: "memory" },
          select: { entityId: true },
        }),
        prisma.personRelationship.findMany({
          where: { personId: person.id },
          include: { relatedPerson: { select: { name: true } } },
        }),
        prisma.personRelationship.findMany({
          where: { relatedPersonId: person.id },
          include: { person: { select: { name: true } } },
        }),
      ]);

      if (links.length > 0) {
        const linkedMemories = await prisma.memory.findMany({
          where: { id: { in: links.map((l) => l.entityId) }, userId },
          take: 8,
        });
        for (const m of linkedMemories) {
          results.push({
            type: "memory",
            id: m.id,
            label: m.title,
            href: `/memories/${m.id}`,
            snippet: `Involves ${person.name}. ${m.date ? m.date.toISOString().slice(0, 10) : "undated"}. ${snippet(m.description)}`,
          });
        }
      }

      const relationshipLines = [
        ...relFrom.map((r) => `${person.name} is ${r.relationshipType} of ${r.relatedPerson.name}`),
        ...relTo.map((r) => `${r.person.name} is ${r.relationshipType} of ${person.name}`),
      ];
      if (relationshipLines.length > 0) {
        results.push({
          type: "person",
          id: person.id,
          label: `${person.name}'s relationships`,
          href: `/people/${person.id}`,
          snippet: relationshipLines.join("; "),
        });
      }
    }
  }

  // Date-range expansion: a mentioned year pulls everything from that year,
  // independent of keyword matches.
  if (year !== null) {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const [memories, events, journal] = await Promise.all([
      prisma.memory.findMany({
        where: { userId, archivedAt: null, date: { gte: start, lt: end } },
        take: 10,
      }),
      prisma.event.findMany({
        where: { userId, archivedAt: null, date: { gte: start, lt: end } },
        take: 10,
      }),
      prisma.journalEntry.findMany({
        where: { userId, visibility: "PUBLIC", occurredAt: { gte: start, lt: end } },
        take: 10,
      }),
    ]);

    for (const m of memories) {
      results.push({
        type: "memory",
        id: m.id,
        label: m.title,
        href: `/memories/${m.id}`,
        snippet: `${m.date!.toISOString().slice(0, 10)}. ${snippet(m.description)}`,
      });
    }
    for (const e of events) {
      results.push({
        type: "event",
        id: e.id,
        label: e.title,
        href: `/events/${e.id}`,
        snippet: `${e.date!.toISOString().slice(0, 10)}. ${snippet(e.description)}`,
      });
    }
    for (const j of journal) {
      results.push({
        type: "journal",
        id: j.id,
        label: j.title ?? j.occurredAt.toISOString().slice(0, 10),
        href: `/journal/${j.id}`,
        snippet: `${j.occurredAt.toISOString().slice(0, 10)}. ${snippet(j.content)}`,
      });
    }
  }

  // Status expansion: "abandoned goals", "active projects", etc.
  if (goalStatus) {
    const goals = await prisma.goal.findMany({ where: { userId, status: goalStatus }, take: 10 });
    for (const g of goals) {
      results.push({
        type: "goal",
        id: g.id,
        label: g.title,
        href: "/goals",
        snippet: `${g.status}. ${snippet(g.description)}`,
      });
    }
  }
  if (projectStatus) {
    const projects = await prisma.project.findMany({
      where: { userId, status: projectStatus },
      take: 10,
    });
    for (const p of projects) {
      results.push({
        type: "project",
        id: p.id,
        label: p.name,
        href: `/projects/${p.id}`,
        snippet: `${p.status}. ${snippet(p.description)}`,
      });
    }
  }

  // Semantic supplement — catches conceptually related memories/journal
  // entries/writings that never share literal words with the question.
  // No-op (returns []) when GEMINI_API_KEY isn't set.
  const semanticMatches = await semanticSearch(userId, question, 10);
  if (semanticMatches.length > 0) {
    const idsByType = new Map<string, string[]>();
    for (const m of semanticMatches) {
      const list = idsByType.get(m.entityType) ?? [];
      list.push(m.entityId);
      idsByType.set(m.entityType, list);
    }

    const [semMemories, semJournal, semWritings] = await Promise.all([
      prisma.memory.findMany({
        where: { id: { in: idsByType.get("memory") ?? [] }, userId, archivedAt: null },
      }),
      prisma.journalEntry.findMany({
        where: { id: { in: idsByType.get("journal") ?? [] }, userId, visibility: "PUBLIC" },
      }),
      prisma.writing.findMany({
        where: { id: { in: idsByType.get("writing") ?? [] }, userId, visibility: "PUBLIC" },
      }),
    ]);

    for (const m of semMemories) {
      results.push({
        type: "memory",
        id: m.id,
        label: m.title,
        href: `/memories/${m.id}`,
        snippet: `${m.date ? m.date.toISOString().slice(0, 10) : "undated"}. ${snippet(m.description)}`,
      });
    }
    for (const j of semJournal) {
      results.push({
        type: "journal",
        id: j.id,
        label: j.title ?? j.occurredAt.toISOString().slice(0, 10),
        href: `/journal/${j.id}`,
        snippet: `${j.occurredAt.toISOString().slice(0, 10)}. ${snippet(j.content)}`,
      });
    }
    for (const w of semWritings) {
      results.push({
        type: "writing",
        id: w.id,
        label: w.title ?? w.type,
        href: "/writings",
        snippet: `${w.type}. ${snippet(w.content)}`,
      });
    }
  }

  const seen = new Set<string>();
  const deduped = results.filter((r) => {
    const key = `${r.type}:${r.id}:${r.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.slice(0, 30);
}
