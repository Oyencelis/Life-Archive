"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ModalShell } from "@/components/shell/ModalShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { unlockArchive } from "@/app/settings/lock-actions";

export function UnlockGate({
  description,
  onClose,
}: {
  description: string;
  // Defaults to navigating back — right when UnlockGate stands in for a
  // whole page's content. Pass an explicit onClose when it's popped as a
  // modal over content that should stay put (e.g. a locked row in a list).
  onClose?: () => void;
}) {
  const [state, formAction, pending] = useActionState(unlockArchive, {});
  const router = useRouter();

  return (
    <ModalShell onClose={onClose ?? (() => router.back())}>
      <PageHeader eyebrow="Locked" title="Enter your PIN" description={description} />
      <form action={formAction} className="entity-form">
        <label>
          PIN
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="6 digits"
            autoComplete="off"
            required
            autoFocus
          />
        </label>
        {state?.error && <p className="setup-error">{state.error}</p>}
        <div className="entity-form-actions">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Checking…" : "Unlock"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
