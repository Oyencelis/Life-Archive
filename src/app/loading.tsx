export default function Loading() {
  return (
    <div className="ed-shell">
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 32 }}>
        <div>
          <span className="ed-skeleton ed-skeleton-eyebrow" />
          <span className="ed-skeleton" style={{ width: "70%", height: 54, marginBottom: 16 }} />
          <span className="ed-skeleton ed-skeleton-desc" style={{ marginBottom: 8 }} />
          <span className="ed-skeleton ed-skeleton-desc" style={{ width: "60%" }} />
        </div>
        <span className="ed-skeleton" style={{ minHeight: 320, borderRadius: 6 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="ed-skeleton" style={{ height: 90, borderRadius: 4 }} />
        ))}
      </div>
    </div>
  );
}
