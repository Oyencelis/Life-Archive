import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { ThemeSwitcher, type ThemeOption } from "./ThemeSwitcher";
import { CustomThemeForm } from "./CustomThemeForm";
import { DeleteAccountForm } from "./DeleteAccountForm";
import { LockPinForm } from "./LockPinForm";
import { minimalTheme } from "@/lib/theme/presets/minimal";
import { MailIcon, PaletteIcon, DownloadIcon } from "./settings-icons";
import type { ThemeTokens } from "@/lib/theme/tokens";
import { hasLockPin } from "@/lib/auth-lock";
import styles from "./settings.module.css";

export default async function SettingsPage() {
  const session = await requireSession();
  const [user, presets, customTheme, pinSet] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, include: { activeTheme: true } }),
    prisma.theme.findMany({ where: { isPreset: true }, orderBy: { createdAt: "asc" } }),
    prisma.theme.findFirst({ where: { userId: session.user.id, key: "custom" } }),
    hasLockPin(session.user.id),
  ]);

  const themeOptions: ThemeOption[] = [...presets, ...(customTheme ? [customTheme] : [])].map(
    (t) => {
      const tokens = t.tokens as unknown as ThemeTokens;
      return {
        id: t.id,
        key: t.key,
        name: t.name,
        colors: { bg: tokens.colors.bg, accent: tokens.colors.accent, ink: tokens.colors.ink },
      };
    }
  );

  return (
    <div className={`${styles.shell} wide-shell`}>
      <section className={styles.hero} aria-label="Introduction">
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          Control room / 001
        </p>
        <h1 className={styles.heading}>
          Make it yours<span className={styles.headingMark}>.</span>
        </h1>
        <p className={styles.heroDesc}>
          Tune the atmosphere of your archive. Your choices shape how every memory feels when
          you return to it.
        </p>
        <p className={styles.heroFootnote}>the interface is part of the memory</p>
      </section>

      <section aria-label="Account overview">
        <div className={styles.accountStrip}>
          <div className={styles.accountItem}>
            <span className={styles.accountIcon} aria-hidden="true">
              <MailIcon />
            </span>
            <div>
              <p className={styles.accountLabel}>Signed in as</p>
              <p className={styles.accountValue}>{user?.email}</p>
            </div>
          </div>
          <div className={styles.accountItem}>
            <span className={styles.accountIcon} aria-hidden="true">
              <PaletteIcon />
            </span>
            <div>
              <p className={styles.accountLabel}>Active theme</p>
              <p className={styles.accountValue}>{user?.activeTheme?.name ?? "Minimal (default)"}</p>
            </div>
          </div>
          <div className={styles.accountItem}>
            <span className={styles.accountIcon} aria-hidden="true">
              <DownloadIcon />
            </span>
            <div>
              <p className={styles.accountLabel}>Data export</p>
              <a href="/api/export" className={styles.accountLink}>
                Download JSON
              </a>
              {" · "}
              <a href="/api/export/markdown" className={styles.accountLink}>
                Download Markdown
              </a>
              {" · "}
              <Link href="/export/print" className={styles.accountLink}>
                Printable view
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Import">
        <p className={styles.sectionEyebrow}>Bring your history in</p>
        <h2 className={styles.sectionHeading}>Import</h2>
        <p className={styles.sectionDesc}>
          Bulk-add journal entries or people from a CSV file instead of typing each one in by hand.
        </p>
        <Link href="/settings/import" className={styles.importLink}>
          Import from CSV
        </Link>
      </section>

      <section aria-label="Sensitive content lock">
        <p className={styles.sectionEyebrow}>Some entries are heavier than others</p>
        <h2 className={styles.sectionHeading}>Sensitive content PIN</h2>
        <p className={styles.sectionDesc}>
          Any journal entry or writing you mark &quot;locked&quot; is hidden behind this PIN, separate
          from your login. Unlocking lasts 30 minutes.
        </p>
        <LockPinForm hasPin={pinSet} />
      </section>

      <section aria-label="Theme presets">
        <p className={styles.sectionEyebrow}>Choose a world</p>
        <h2 className={styles.sectionHeading}>Atmospheres</h2>
        <p className={styles.sectionDesc}>
          Every preset below is a complete mood — color, type, motion, and texture, tuned as a
          set rather than picked apart.
        </p>
        <ThemeSwitcher themes={themeOptions} activeThemeId={user?.activeThemeId ?? null} />
      </section>

      <section aria-label="Custom theme">
        <p className={styles.sectionEyebrow}>Fine tuning</p>
        <h2 className={styles.sectionHeading}>Build your own</h2>
        <p className={styles.sectionDesc}>
          Every color, every corner, every transition — set it exactly how you want it, then
          activate it as your own atmosphere.
        </p>
        <CustomThemeForm defaults={(customTheme?.tokens as unknown as ThemeTokens) ?? minimalTheme} />
      </section>

      <section className={styles.dangerZone} aria-label="Danger zone">
        <div className={styles.dangerBox}>
          <h2 className={styles.dangerHeading}>The last page</h2>
          <p className={styles.dangerCopy}>
            This permanently deletes your account and every record in it — people, memories,
            journal entries, everything. There is no undo. Export your data first if you want
            to keep it.
          </p>
          <DeleteAccountForm email={user?.email ?? ""} />
        </div>
      </section>
    </div>
  );
}
