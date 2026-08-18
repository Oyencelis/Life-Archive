// Neutral fallback for pages that aren't part of the .ed-shell editorial
// system (auth/onboarding/settings) — a plain centered spinner instead of
// an entity-shaped skeleton that would assume a layout those pages don't have.
export function Spinner() {
  return (
    <div className="ed-spinner-center" role="status" aria-label="Loading">
      <span className="ed-spinner" />
    </div>
  );
}
