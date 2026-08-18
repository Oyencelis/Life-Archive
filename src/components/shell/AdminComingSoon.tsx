import { EmptyState } from "@/components/shell/EmptyState";

export function AdminComingSoon({ entity, phase }: { entity: string; phase: string }) {
  return (
    <EmptyState
      eyebrow="Not built yet"
      title={`${entity} management ships in ${phase}.`}
      body={`This route exists so the admin's structure is settled now — full create, edit, and delete tools for ${entity.toLowerCase()} arrive in ${phase} without moving this page.`}
    />
  );
}
