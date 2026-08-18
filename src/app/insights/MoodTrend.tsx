import type { MoodPoint } from "@/lib/discovery/mood";

function topMood(moods: Record<string, number>): string | null {
  const entries = Object.entries(moods);
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

export function MoodTrend({ points }: { points: MoodPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.total));

  return (
    <section aria-label="Mood over time" style={{ marginBottom: 40 }}>
      <p className="ed-eyebrow-small">Logged moods, last {points.length} months</p>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          height: 120,
          marginTop: 12,
          paddingBottom: 4,
          borderBottom: "1px solid var(--color-border, #ddd)",
        }}
      >
        {points.map((p) => (
          <div
            key={p.key}
            title={
              p.total === 0
                ? `${p.label}: no mood logged`
                : `${p.label}: ${Object.entries(p.moods)
                    .map(([m, n]) => `${m} (${n})`)
                    .join(", ")}`
            }
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 32,
                height: `${Math.max(4, (p.total / max) * 96)}px`,
                background: p.total > 0 ? "var(--color-accent, #999)" : "var(--color-border, #ddd)",
                borderRadius: 3,
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
        {points.map((p) => (
          <div key={p.key} style={{ flex: 1, textAlign: "center", fontSize: 12 }}>
            <div style={{ color: "var(--color-ink-soft)" }}>{p.label}</div>
            <div style={{ fontWeight: 500 }}>{topMood(p.moods) ?? "—"}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
