"use client";

import { useTransition } from "react";
import { setActiveTheme } from "./theme-actions";
import { CheckIcon } from "./settings-icons";
import styles from "./settings.module.css";

export interface ThemeOption {
  id: string;
  key: string;
  name: string;
  description?: string;
  colors: { bg: string; accent: string; ink: string };
}

export function ThemeSwitcher({
  themes,
  activeThemeId,
}: {
  themes: ThemeOption[];
  activeThemeId: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className={styles.themeGrid}>
      {themes.map((theme) => {
        const active = theme.id === activeThemeId;
        return (
          <li key={theme.id}>
            <button
              type="button"
              className={`${styles.themeCard} ${active ? styles.themeCardActive : ""}`}
              disabled={pending}
              aria-pressed={active}
              onClick={() => startTransition(() => setActiveTheme(theme.id))}
            >
              {active && (
                <span className={styles.themeCheck} aria-hidden="true">
                  <CheckIcon />
                </span>
              )}
              <span className={styles.themePreview} style={{ background: theme.colors.bg }}>
                <span className={styles.themeDot} style={{ background: theme.colors.accent }} />
                <span className={styles.themeDot} style={{ background: theme.colors.ink }} />
              </span>
              <span className={styles.themeName}>{theme.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
