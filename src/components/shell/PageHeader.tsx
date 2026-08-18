export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="page-header">
      <p className="page-header-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="page-header-desc">{description}</p>
    </header>
  );
}
