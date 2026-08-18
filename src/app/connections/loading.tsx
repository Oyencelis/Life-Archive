export default function Loading() {
  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <span className="ed-skeleton ed-skeleton-eyebrow" />
          <span className="ed-skeleton ed-skeleton-heading" />
          <span className="ed-skeleton ed-skeleton-desc" />
        </div>
      </div>
      <span className="ed-skeleton" style={{ width: "100%", aspectRatio: "900 / 560", borderRadius: 10 }} />
    </div>
  );
}
