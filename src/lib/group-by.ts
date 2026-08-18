export interface Group<T> {
  key: string;
  items: T[];
}

// Buckets items by a string key. With no `order`, groups sort
// alphabetically by key (used for free-text fields like Person/Place
// category). Pass `order` for enum-backed fields so groups follow the
// enum's declared sequence instead — any key not listed falls back to the
// end, alphabetically, so unrecognized/custom values still show up rather
// than disappearing.
export function groupByKey<T>(
  items: T[],
  keyFn: (item: T) => string,
  order?: string[]
): Group<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const arr = map.get(key);
    if (arr) arr.push(item);
    else map.set(key, [item]);
  }

  const keys = order
    ? [
        ...order.filter((k) => map.has(k)),
        ...[...map.keys()].filter((k) => !order.includes(k)).sort(),
      ]
    : [...map.keys()].sort();

  return keys.map((key) => ({ key, items: map.get(key)! }));
}
