import type { ReactNode } from "react";

export function EmptyState({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <p className="empty-state-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="empty-state-body">{body}</p>
      {action}
    </div>
  );
}
