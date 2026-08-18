"use client";

import { useActionState } from "react";
import { ArrowUpRightIcon } from "@/app/editorial-icons";
import { createOwnerAccount } from "./actions";
import styles from "./setup.module.css";

export function SetupForm() {
  const [state, formAction, pending] = useActionState(createOwnerAccount, {});

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="setup-name">Name</label>
        <input id="setup-name" name="name" type="text" autoComplete="name" required />
      </div>

      <div className={styles.field}>
        <label htmlFor="setup-email">Email</label>
        <input id="setup-email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className={styles.field}>
        <label htmlFor="setup-password">Password</label>
        <input
          id="setup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      {state?.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Creating archive…" : "Create archive"}
        <ArrowUpRightIcon size={14} />
      </button>
    </form>
  );
}
