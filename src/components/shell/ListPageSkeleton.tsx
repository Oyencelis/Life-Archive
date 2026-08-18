// Shown instantly (via loading.tsx) while a list page's server component
// fetches its data — roughly matches the real record-cards/record-groups
// layout so there's minimal shift when the real content swaps in.
export function ListPageSkeleton({ rows = false }: { rows?: boolean }) {
  return (
    <div className="ed-shell">
      <div className="ed-index-head">
        <div>
          <span className="ed-skeleton ed-skeleton-eyebrow" />
          <span className="ed-skeleton ed-skeleton-heading" />
          <span className="ed-skeleton ed-skeleton-desc" />
        </div>
        <span className="ed-skeleton ed-skeleton-cta" />
      </div>

      {rows ? (
        <div className="ed-skeleton-rows">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="ed-skeleton ed-skeleton-row" />
          ))}
        </div>
      ) : (
        <div className="ed-skeleton-cards">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="ed-skeleton ed-skeleton-card" />
          ))}
        </div>
      )}
    </div>
  );
}
