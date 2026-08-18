"use client";

import { useActionState } from "react";
import { ArrowUpRightIcon } from "@/app/editorial-icons";
import { login } from "./actions";
import styles from "./login.module.css";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className={styles.field}>
        <label htmlFor="login-email">Email</label>
        <input id="login-email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className={styles.field}>
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state?.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
        <ArrowUpRightIcon size={14} />
      </button>
    </form>
  );
}
