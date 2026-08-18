"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/shell/ConfirmSubmitButton";
import { updateLockPin, removeLockPin } from "./lock-actions";

export function LockPinForm({ hasPin }: { hasPin: boolean }) {
  const [state, formAction, pending] = useActionState(updateLockPin, {});

  return (
    <div className="entity-form" style={{ maxWidth: 320 }}>
      <form action={formAction} className="entity-form-row" style={{ alignItems: "flex-end" }}>
        <label style={{ flex: 1 }}>
          {hasPin ? "Change PIN" : "Set a PIN"}
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="6 digits"
            autoComplete="off"
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
      {state?.error && <p className="setup-error">{state.error}</p>}
      {state?.success && <p className="record-row-meta">{state.success}</p>}
      {hasPin && (
        <form action={removeLockPin} style={{ marginTop: 8 }}>
          <ConfirmSubmitButton
            label="Remove PIN"
            confirmText="Remove the PIN? Entries currently marked as locked will stay locked until you set a new PIN."
          />
        </form>
      )}
    </div>
  );
}
