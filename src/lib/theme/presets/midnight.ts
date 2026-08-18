import type { ThemeTokens } from "@/lib/theme/tokens";

export const midnightTheme: ThemeTokens = {
  colors: {
    bg: "#0e0f12",
    bgRaised: "#16181c",
    bgSunk: "#0a0b0d",
    ink: "#e8e6e1",
    inkSoft: "#a7a39c",
    inkFaint: "#817c74",
    line: "#26282d",
    accent: "#7c9eff",
    accentInk: "#0b0d14",
    accentSoft: "#1b2035",
  },
  type: {
    display: "Georgia, 'Times New Roman', serif",
    body: "-apple-system, 'Segoe UI', sans-serif",
    mono: "'SF Mono', Consolas, monospace",
    scale: 1,
  },
  surface: {
    cardStyle: "flat",
    radius: "8px",
    border: "hairline",
    shadow: "soft",
  },
  motion: {
    duration: 0.35,
    easing: "ease-in-out",
    stagger: 0.05,
    density: "measured",
  },
  decorative: {
    slots: ["moon-glow"],
  },
};
