import type { ThemeTokens } from "@/lib/theme/tokens";

export const cuteTheme: ThemeTokens = {
  colors: {
    bg: "#fff6f8",
    bgRaised: "#ffffff",
    bgSunk: "#ffeaf0",
    ink: "#4a2b38",
    inkSoft: "#8a6470",
    inkFaint: "#9b6274",
    line: "#ffd9e4",
    accent: "#d10048",
    accentInk: "#ffffff",
    accentSoft: "#ffe1ec",
  },
  type: {
    display: "'Segoe Print', 'Comic Sans MS', cursive",
    body: "-apple-system, 'Segoe UI', sans-serif",
    mono: "'SF Mono', Consolas, monospace",
    scale: 1,
  },
  surface: {
    cardStyle: "soft",
    radius: "22px",
    border: "none",
    shadow: "soft",
  },
  motion: {
    duration: 0.4,
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    stagger: 0.06,
    density: "lively",
  },
  decorative: {
    slots: ["confetti"],
  },
};
