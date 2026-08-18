import type { ThemeTokens } from "@/lib/theme/tokens";

const BORDER_WIDTH: Record<ThemeTokens["surface"]["border"], string> = {
  none: "0",
  hairline: "1px",
  heavy: "2px",
  dashed: "1px",
};

const BORDER_STYLE: Record<ThemeTokens["surface"]["border"], string> = {
  none: "none",
  hairline: "solid",
  heavy: "solid",
  dashed: "dashed",
};

const SHADOW: Record<ThemeTokens["surface"]["shadow"], string> = {
  none: "none",
  soft: "0 14px 32px -18px rgba(20, 16, 12, 0.28)",
  hard: "5px 5px 0 0 var(--color-ink)",
};

// Turns a theme token bundle into the CSS custom properties every
// component reads from. Rendered server-side into a <style> tag so the
// active theme paints on first frame — no flash, no client JS required
// just to look right.
export function tokensToCssVariables(tokens: ThemeTokens): string {
  const { colors, type, surface, motion } = tokens;
  return `:root {
  --color-bg: ${colors.bg};
  --color-bg-raised: ${colors.bgRaised};
  --color-bg-sunk: ${colors.bgSunk};
  --color-ink: ${colors.ink};
  --color-ink-soft: ${colors.inkSoft};
  --color-ink-faint: ${colors.inkFaint};
  --color-line: ${colors.line};
  --color-accent: ${colors.accent};
  --color-accent-ink: ${colors.accentInk};
  --color-accent-soft: ${colors.accentSoft};
  --font-display: ${type.display};
  --font-body: ${type.body};
  --font-mono: ${type.mono};
  --type-scale: ${type.scale};
  --surface-radius: ${surface.radius};
  --surface-border-width: ${BORDER_WIDTH[surface.border]};
  --surface-border-style: ${BORDER_STYLE[surface.border]};
  --surface-shadow: ${SHADOW[surface.shadow]};
  --motion-duration: ${motion.duration}s;
  --motion-easing: ${motion.easing};
  --motion-stagger: ${motion.stagger}s;
}`;
}
