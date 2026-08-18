"use client";

import { useActionState, useState } from "react";
import { deleteAccount } from "./account-actions";
import styles from "./settings.module.css";

export function DeleteAccountForm({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [state, formAction, pending] = useActionState(deleteAccount, {});

  if (!open) {
    return (
      <button type="button" className={styles.dangerTrigger} onClick={() => setOpen(true)}>
        Delete account
      </button>
    );
  }

  return (
    <form action={formAction} className={styles.dangerForm}>
      <label>
        Type <strong>{email}</strong> to confirm
        <input
          name="confirmEmail"
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          required
        />
      </label>
      {state?.error && <p className={styles.errorNote}>{state.error}</p>}
      <div className={styles.dangerActions}>
        <button
          type="submit"
          className={styles.dangerConfirm}
          disabled={pending || confirmText.trim().toLowerCase() !== email.toLowerCase()}
        >
          {pending ? "Deleting…" : "Permanently delete my account"}
        </button>
        <button type="button" className={styles.dangerCancel} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
