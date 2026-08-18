-- Rename Visibility.UNLISTED -> PUBLIC. This is a label rename, not a
-- remove+add: every existing row keeps its value, just under the new name.
ALTER TYPE "Visibility" RENAME VALUE 'UNLISTED' TO 'PUBLIC';

-- JournalEntry: `isLocked` becomes redundant with `visibility` (PRIVATE now
-- means PIN-gated). The old `visibility` column has been purely decorative
-- until now (nothing ever branched on it), so it is NOT the source of
-- truth here — `isLocked` (the actually-enforced flag) is, to avoid
-- silently locking entries nobody asked to lock.
UPDATE "JournalEntry" SET "visibility" = CASE WHEN "isLocked" THEN 'PRIVATE' ELSE 'PUBLIC' END::"Visibility";
ALTER TABLE "JournalEntry" DROP COLUMN "isLocked";

-- Writing: same merge, from scratch (Writing had no visibility column
-- before).
ALTER TABLE "Writing" ADD COLUMN "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC';
UPDATE "Writing" SET "visibility" = 'PRIVATE' WHERE "isLocked" = true;
ALTER TABLE "Writing" DROP COLUMN "isLocked";

-- Person: new lock flag, defaults false for every existing row.
ALTER TABLE "Person" ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false;
