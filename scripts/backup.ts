// Full local backup: dumps every table to JSON and downloads every media
// object from Supabase Storage, into backups/<timestamp>/. Supabase's own
// backups cover disaster recovery on their end, but an independent copy
// protects against account lockout, accidental bulk deletes, or a billing
// lapse — none of which Supabase's backups help with.
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { storageAdmin, MEDIA_BUCKET } from "../src/lib/storage/supabase";

const prisma = new PrismaClient();

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(process.cwd(), "backups", timestamp);
  fs.mkdirSync(outDir, { recursive: true });

  const [
    users,
    people,
    personRelationships,
    memories,
    journalEntries,
    media,
    places,
    events,
    eras,
    timelineEvents,
    projects,
    interests,
    goals,
    writings,
    reflections,
    tags,
    entityPeople,
    entityTags,
    mediaLinks,
  ] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true, createdAt: true } }),
    prisma.person.findMany(),
    prisma.personRelationship.findMany(),
    prisma.memory.findMany(),
    prisma.journalEntry.findMany(),
    prisma.media.findMany(),
    prisma.place.findMany(),
    prisma.event.findMany(),
    prisma.era.findMany(),
    prisma.timelineEvent.findMany(),
    prisma.project.findMany(),
    prisma.interest.findMany(),
    prisma.goal.findMany(),
    prisma.writing.findMany(),
    prisma.reflection.findMany({ include: { versions: true } }),
    prisma.tag.findMany(),
    prisma.entityPerson.findMany(),
    prisma.entityTag.findMany(),
    prisma.mediaLink.findMany(),
  ]);

  const dump = {
    backedUpAt: new Date().toISOString(),
    format: "life-archive-backup/1",
    users,
    people,
    personRelationships,
    memories,
    journalEntries,
    media,
    places,
    events,
    eras,
    timelineEvents,
    projects,
    interests,
    goals,
    writings,
    reflections,
    tags,
    links: { entityPeople, entityTags, mediaLinks },
  };

  fs.writeFileSync(path.join(outDir, "database.json"), JSON.stringify(dump, null, 2));

  const mediaDir = path.join(outDir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });

  let downloaded = 0;
  let failed = 0;
  for (const item of media) {
    const { data, error } = await storageAdmin.from(MEDIA_BUCKET).download(item.storageKey);
    if (error || !data) {
      failed += 1;
      console.warn(`Skipped ${item.storageKey}: ${error?.message ?? "no data"}`);
      continue;
    }
    const destPath = path.join(mediaDir, item.storageKey);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(await data.arrayBuffer()));
    downloaded += 1;
  }

  console.log(`Backup written to ${outDir}`);
  console.log(`Media: ${downloaded} downloaded, ${failed} failed (of ${media.length})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
