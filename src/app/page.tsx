import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { getOnThisDay } from "@/lib/discovery/on-this-day";
import { getUpcoming } from "@/lib/discovery/upcoming";
import { getSignedMediaUrls } from "@/lib/storage/media";
import { resolveMediaLinksForUser } from "@/lib/storage/resolve";
import { Reveal } from "@/components/shell/Reveal";
import { SurpriseMe } from "./SurpriseMe";
import { ArrowUpRightIcon, ChronicleIcon, PeopleDoorIcon, StoryIcon, MadeIcon } from "./editorial-icons";
import styles from "./home.module.css";

type Tone = "terracotta" | "mint" | "yellow" | "paper";

const ENTITY_TYPE_LABEL: Record<string, string> = {
  memory: "Memory",
  person: "Person",
  event: "Event",
  place: "Place",
  project: "Project",
  journal: "Journal",
};

export default async function HomePage() {
  const session = await requireSession();
  const userId = session.user.id;

  const [
    memoryCount,
    peopleCount,
    journalCount,
    mediaCount,
    onThisDay,
    upcoming,
    lastJournalEntry,
    user,
    recentCoverLinks,
  ] = await Promise.all([
    prisma.memory.count({ where: { userId } }),
    prisma.person.count({ where: { userId, isSelf: false } }),
    prisma.journalEntry.count({ where: { userId } }),
    prisma.media.count({ where: { userId } }),
    getOnThisDay(userId),
    getUpcoming(userId),
    prisma.journalEntry.findFirst({
      where: { userId },
      orderBy: { occurredAt: "desc" },
      select: { occurredAt: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.mediaLink.findMany({
      where: { role: "cover", media: { userId } },
      select: { mediaId: true, entityType: true, entityId: true, media: { select: { storageKey: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const daysSinceJournal = lastJournalEntry
    ? Math.floor((new Date().getTime() - lastJournalEntry.occurredAt.getTime()) / 86_400_000)
    : null;
  const journalNudge = daysSinceJournal === null || daysSinceJournal >= 7;

  const [recentCoverUrls, recentCoverLabels] = await Promise.all([
    getSignedMediaUrls(recentCoverLinks.map((link) => link.media.storageKey)),
    resolveMediaLinksForUser(
      userId,
      recentCoverLinks.map((link) => link.mediaId)
    ),
  ]);

  const recentTiles = recentCoverLinks
    .map((link) => {
      const url = recentCoverUrls.get(link.media.storageKey);
      const candidates = recentCoverLabels.get(link.mediaId) ?? [];
      const resolved = candidates.find((c) => c.href.endsWith(`/${link.entityId}`)) ?? candidates[0];
      if (!url || !resolved) return null;
      return {
        id: `${link.mediaId}-${link.entityId}`,
        url,
        label: resolved.label,
        href: resolved.href,
        type: ENTITY_TYPE_LABEL[link.entityType] ?? link.entityType,
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  const isEmpty = memoryCount + peopleCount + journalCount === 0;
  const currentYear = new Date().getFullYear();
  const estYear = user?.createdAt.getUTCFullYear() ?? currentYear;
  const displayName = session.user.name?.trim() || "you";
  const featured = onThisDay[0];
  const restOfDay = onThisDay.slice(1);

  const stats: { label: string; plural: string; value: number; tone: Tone }[] = [
    { label: "Memory", plural: "Memories", value: memoryCount, tone: "terracotta" },
    { label: "Person", plural: "People", value: peopleCount, tone: "mint" },
    { label: "Journal entry", plural: "Journal entries", value: journalCount, tone: "yellow" },
    { label: "Media item", plural: "Media items", value: mediaCount, tone: "paper" },
  ];

  const drawers: {
    n: string;
    title: string;
    desc: string;
    href: string;
    tone: Tone;
    Icon: typeof ChronicleIcon;
  }[] = [
    { n: "01", title: "Chronicle", desc: "Time & turning points", href: "/timeline", tone: "terracotta", Icon: ChronicleIcon },
    { n: "02", title: "People", desc: "The ones who shaped it", href: "/people", tone: "mint", Icon: PeopleDoorIcon },
    { n: "03", title: "Story", desc: "Memories & fragments", href: "/memories", tone: "yellow", Icon: StoryIcon },
    { n: "04", title: "Made", desc: "Work in progress", href: "/projects", tone: "paper", Icon: MadeIcon },
  ];

  const fieldNoteHref = featured ? featured.href : isEmpty ? "/memories/new" : "/timeline";
  const fieldNoteAria = featured
    ? `Open "on this day" memory: ${featured.label}`
    : isEmpty
      ? "Add your first memory"
      : "Open the timeline";

  return (
    <div className="ed-shell">
      <section className={styles.hero} aria-label="Introduction">
        <div className={styles.heroLeft}>
          <p className="ed-eyebrow">
            <span className="ed-dot" aria-hidden="true" />
            Current chapter / {currentYear}
          </p>

          <h1 className="ed-headline">
            A life,
            <em>in</em>
            <em>progress.</em>
          </h1>

          <p className="ed-hero-desc">
            A living record of the people, places, half-formed ideas, and small
            moments that made {displayName === "you" ? "you" : displayName}.
          </p>

          {isEmpty && (
            <Link href="/memories/new" className={`ed-cta-primary ${styles.emptyCta}`}>
              Add your first memory
              <ArrowUpRightIcon size={13} />
            </Link>
          )}

          <div className={styles.noteWrap}>
            <span className={styles.noteLabel}>Note to self</span>
            <figure className={styles.noteCard}>
              <blockquote className={styles.noteQuote}>
                &ldquo;The details are the story.&rdquo;
              </blockquote>
              <figcaption className={styles.noteAttr}>
                — {displayName}, somewhere in {currentYear}
              </figcaption>
            </figure>
          </div>
        </div>

        <Link href={fieldNoteHref} className={styles.fieldNote} aria-label={fieldNoteAria}>
          <div className={styles.fieldNoteTop}>
            <span className={styles.fieldNoteLabel}>Field notes / 001</span>
            <ArrowUpRightIcon />
          </div>

          <div className={styles.fieldNoteBody}>
            <p className={styles.fieldNoteKicker}>
              {featured ? "On this day, years ago" : "The archive begins with"}
            </p>
            <p className={styles.fieldNoteHeadline}>
              {featured ? (
                featured.label
              ) : (
                <>
                  one true <span className={styles.mintWord}>thing.</span>
                </>
              )}
            </p>
          </div>

          <div className={styles.fieldNoteFoot}>
            <p>
              {featured
                ? featured.snippet ||
                  `${featured.yearsAgo} ${featured.yearsAgo === 1 ? "year" : "years"} ago.`
                : "Not a feed. Not a performance. Just a place to keep what matters."}
            </p>
            <span className={styles.fieldNoteEst}>Est. {estYear}</span>
          </div>
        </Link>
      </section>

      <Reveal>
        <ul className={styles.statRow} aria-label="Archive snapshot">
          {stats.map((s) => (
            <li key={s.label} className={`${styles.statTile} ed-tone-${s.tone}`}>
              <span className={styles.statValue}>{String(s.value).padStart(2, "0")}</span>
              <span className={styles.statLabel}>{s.value === 1 ? s.label : s.plural}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      {recentTiles.length > 0 && (
        <Reveal>
          <section className={styles.mosaic} aria-label="Recently added to the archive">
            <div className={styles.mosaicHead}>
              <div>
                <p className="ed-eyebrow-small">The wall so far</p>
                <h2 className={styles.mosaicTitle}>Recently added.</h2>
              </div>
              <p className={styles.mosaicMeta}>{recentTiles.length} on display</p>
            </div>

            <div className={styles.mosaicGrid}>
              {recentTiles.map((tile) => (
                <Link key={tile.id} href={tile.href} className={styles.mosaicItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tile.url} alt="" className={styles.mosaicImg} />
                  <div className={styles.mosaicCaption}>
                    <p className={styles.mosaicCaptionLabel}>{tile.label}</p>
                    <p className={styles.mosaicCaptionMeta}>{tile.type}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {restOfDay.length > 0 && (
        <Reveal>
          <section className={styles.onThisDay} aria-label="More from this day in past years">
            <p className="ed-eyebrow-small">Also on this day</p>
            <ul className={styles.onThisDayList}>
              {restOfDay.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <Link href={item.href}>{item.label}</Link>
                  <span>
                    {item.yearsAgo} {item.yearsAgo === 1 ? "year" : "years"} ago
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      {upcoming.length > 0 && (
        <Reveal>
          <section className={styles.onThisDay} aria-label="Birthdays and anniversaries coming up">
            <p className="ed-eyebrow-small">Coming up</p>
            <ul className={styles.onThisDayList}>
              {upcoming.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <Link href={item.href}>{item.label}</Link>
                  <span>
                    {item.daysAway === 0 ? "today" : item.daysAway === 1 ? "tomorrow" : `in ${item.daysAway} days`}
                    {item.turningAge !== null ? ` · turning ${item.turningAge}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      {journalNudge && !isEmpty && (
        <Reveal>
          <section className={styles.onThisDay} aria-label="Journal reminder">
            <p className="ed-eyebrow-small">A nudge</p>
            <p className={styles.fieldNoteHeadline} style={{ fontSize: "1.1rem" }}>
              {daysSinceJournal === null
                ? "You haven't written a journal entry yet."
                : `It's been ${daysSinceJournal} days since your last journal entry.`}{" "}
              <Link href="/journal/new" className="ed-cta-ghost">
                Write one now →
              </Link>
            </p>
          </section>
        </Reveal>
      )}

      <Reveal>
        <section className={styles.drawersSection} aria-label="Find your way in">
          <div className={styles.drawersHead}>
            <div>
              <p className="ed-eyebrow-small">Open the drawers</p>
              <h2 className={styles.drawersTitle}>Find your way in.</h2>
            </div>
            <p className={styles.drawersMeta}>04 doors / infinite routes</p>
          </div>

          <nav className={styles.drawersGrid} aria-label="Primary sections">
            {drawers.map(({ n, title, desc, href, tone, Icon }) => (
              <Link key={title} href={href} className={`${styles.drawer} ed-tone-${tone}`}>
                <div className={styles.drawerTop}>
                  <Icon />
                  <span className={styles.drawerN}>{n}</span>
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </Link>
            ))}
          </nav>
        </section>
      </Reveal>

      <Reveal>
        <section className={styles.prompt} aria-label="Suggestion">
          <div>
            <p className="ed-eyebrow-small">A small prompt</p>
            <h2 className={styles.promptTitle}>
              Your archive is quiet. That is about to change.
            </h2>
          </div>
          <SurpriseMe
            className={styles.surprise}
            buttonClassName="ed-surprise-btn"
            resultClassName="ed-surprise-result"
          />
        </section>
      </Reveal>

      <footer className="ed-colophon">
        <span>Archive / a personal museum</span>
        <span>Private by design · yours by default</span>
      </footer>
    </div>
  );
}
