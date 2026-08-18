import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SetupForm } from "./SetupForm";
import styles from "./setup.module.css";

export default async function SetupPage() {
  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    redirect("/login");
  }

  return (
    <main className={`${styles.shell} wide-shell`}>
      <section className={styles.hero}>
        <span className={`${styles.heroRing} ${styles.heroRingOne}`} aria-hidden="true" />
        <span className={`${styles.heroRing} ${styles.heroRingTwo}`} aria-hidden="true" />

        <p className={styles.heroEyebrow}>First run</p>
        <h1 className={styles.heroHeading}>Start your archive</h1>

        {/* Not a <blockquote> — see the matching note in login/page.tsx. */}
        <div className={styles.heroQuote}>
          <p>
            This is the only account this archive will have unless you invite others later. There
            is no public sign-up.
          </p>
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

            <SetupForm />
          </div>
        </div>
      </div>
    </main>
  );
}
