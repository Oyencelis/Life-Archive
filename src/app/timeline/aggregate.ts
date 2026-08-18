export interface TimelineItem {
  id: string;
  kind: "memory" | "event" | "journal" | "milestone";
  title: string;
  date: Date;
  href: string;
  eraId: string | null;
}

export interface EraLite {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  sortOrder: number;
}

export interface TimelineGroup {
  key: string;
  label: string;
  items: TimelineItem[];
  sortDate: number;
}

function eraForItem(eras: EraLite[], item: TimelineItem): EraLite | null {
  if (item.eraId) {
    return eras.find((e) => e.id === item.eraId) ?? null;
  }
  return (
    eras.find(
      (e) => e.startDate && e.endDate && item.date >= e.startDate && item.date <= e.endDate
    ) ?? null
  );
}

export function buildTimelineGroups(eras: EraLite[], items: TimelineItem[]): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>();

  for (const item of items) {
    const era = eraForItem(eras, item);
    const key = era ? `era:${era.id}` : `year:${item.date.getFullYear()}`;
    const label = era ? era.name : String(item.date.getFullYear());

    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        label,
        items: [],
        sortDate: era?.startDate?.getTime() ?? item.date.getTime(),
      };
      groups.set(key, group);
    }
    group.items.push(item);
    group.sortDate = Math.min(group.sortDate, item.date.getTime());
  }

  for (const group of groups.values()) {
    group.items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  return Array.from(groups.values()).sort((a, b) => a.sortDate - b.sortDate);
}
