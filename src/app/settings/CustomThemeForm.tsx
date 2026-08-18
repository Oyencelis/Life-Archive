"use client";

import { useActionState } from "react";
import { saveCustomTheme } from "./theme-actions";
import { CheckIcon } from "./settings-icons";
import type { ThemeTokens } from "@/lib/theme/tokens";
import styles from "./settings.module.css";

const COLOR_FIELDS: { key: keyof ThemeTokens["colors"]; label: string }[] = [
  { key: "bg", label: "Background" },
  { key: "bgRaised", label: "Raised surface" },
  { key: "bgSunk", label: "Sunken surface" },
  { key: "ink", label: "Text" },
  { key: "inkSoft", label: "Text (soft)" },
  { key: "inkFaint", label: "Text (faint)" },
  { key: "line", label: "Lines / borders" },
  { key: "accent", label: "Accent" },
  { key: "accentInk", label: "Text on accent" },
  { key: "accentSoft", label: "Accent (soft)" },
];

export function CustomThemeForm({ defaults }: { defaults: ThemeTokens }) {
  const [state, formAction, pending] = useActionState(saveCustomTheme, {});

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.swatchGrid}>
        {COLOR_FIELDS.map((f) => (
          <label key={f.key} className={styles.swatchField}>
            <input
              type="color"
              name={f.key}
              defaultValue={defaults.colors[f.key]}
              aria-label={f.label}
              className={styles.swatchInput}
            />
            <span className={styles.swatchLabel}>{f.label}</span>
          </label>
        ))}
      </div>

      <div className={styles.formRow}>
        <label className={styles.field}>
          Typography
          <select name="typePreset" defaultValue="serif">
            <option value="serif">Serif</option>
            <option value="sans">Sans</option>
            <option value="mono">Monospace</option>
            <option value="cursive">Cursive</option>
          </select>
        </label>
        <label className={styles.field}>
          Corner radius
          <input name="radius" type="text" defaultValue={defaults.surface.radius} />
        </label>
      </div>

      <div className={styles.formRow}>
        <label className={styles.field}>
          Border
          <select name="border" defaultValue={defaults.surface.border}>
            <option value="none">None</option>
            <option value="hairline">Hairline</option>
            <option value="heavy">Heavy</option>
            <option value="dashed">Dashed</option>
          </select>
        </label>
        <label className={styles.field}>
          Shadow
          <select name="shadow" defaultValue={defaults.surface.shadow}>
            <option value="none">None</option>
            <option value="soft">Soft</option>
            <option value="hard">Hard</option>
          </select>
        </label>
      </div>

      <label className={styles.field} style={{ maxWidth: 260 }}>
        Motion feel
        <select name="density" defaultValue={defaults.motion.density}>
          <option value="quiet">Quiet</option>
          <option value="measured">Measured</option>
          <option value="lively">Lively</option>
        </select>
      </label>

      {state?.error && <p className={styles.errorNote}>{state.error}</p>}

      <div className={styles.formActions}>
        <button type="submit" className={styles.activateBtn} disabled={pending}>
          {pending ? "Activating…" : "Activate custom theme"}
        </button>
        {state?.success && !pending && (
          <span className={styles.successNote}>
            <CheckIcon />
            Activated
          </span>
        )}
      </div>
    </form>
  );
}
