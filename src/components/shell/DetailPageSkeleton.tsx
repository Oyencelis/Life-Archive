// Shown instantly (via loading.tsx) while an entity detail page's server
// component fetches its data — mirrors EntityFeature's hero/facts/body
// shape so the swap-in doesn't jump the layout around.
export function DetailPageSkeleton() {
  return (
    <div className="ed-shell">
      <article>
        <span className="ed-skeleton ed-skeleton-eyebrow" style={{ marginBottom: 20 }} />
        <span className="ed-skeleton ed-skeleton-hero" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 0, margin: "28px 0" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="ed-skeleton ed-skeleton-fact" />
          ))}
        </div>
        <div style={{ maxWidth: "60ch" }}>
          <span className="ed-skeleton ed-skeleton-line" style={{ width: "100%" }} />
          <span className="ed-skeleton ed-skeleton-line" style={{ width: "92%" }} />
          <span className="ed-skeleton ed-skeleton-line" style={{ width: "96%" }} />
          <span className="ed-skeleton ed-skeleton-line" style={{ width: "70%" }} />
        </div>
      </article>
    </div>
  );
}
