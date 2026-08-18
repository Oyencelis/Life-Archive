import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/");

  const existingCount = await prisma.user.count();
  if (existingCount === 0) redirect("/setup");

  const { callbackUrl } = await searchParams;

  return (
    // "wide-shell" opts out of the app's default 980px content column
    // (see globals.css) without pulling in .ed-shell's editorial palette —
    // this page's own --paper/--ink/--terracotta aliasing above handles
    // that instead.
    <main className={`${styles.shell} wide-shell`}>
      <section className={styles.hero}>
        <span className={`${styles.heroRing} ${styles.heroRingOne}`} aria-hidden="true" />
        <span className={`${styles.heroRing} ${styles.heroRingTwo}`} aria-hidden="true" />

        <p className={styles.heroEyebrow}>Private archive</p>
        <h1 className={styles.heroHeading}>Welcome back</h1>

        {/* Not a <blockquote> — this isn't quoted material, just the
            existing sub-copy styled with a rule, so a screen reader
            shouldn't announce it as a quotation. */}
        <div className={styles.heroQuote}>
          <p>Sign in to continue exploring your archive.</p>
        </div>

        <span className={styles.heroTag} aria-hidden="true">
          Archive
        </span>
      </section>

      <div className={styles.formSide}>
        <div className={styles.panelWrap}>
          <div className={styles.panelFrame} aria-hidden="true" />
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <p className={styles.wordmark}>Archive</p>
              <svg
                className={styles.lockIcon}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>

            <LoginForm callbackUrl={callbackUrl ?? "/"} />
          </div>
        </div>
      </div>
    </main>
  );
}
