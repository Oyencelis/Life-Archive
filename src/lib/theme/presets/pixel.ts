import type { ThemeTokens } from "@/lib/theme/tokens";

export const pixelTheme: ThemeTokens = {
  colors: {
    bg: "#1a1435",
    bgRaised: "#241d47",
    bgSunk: "#120e28",
    ink: "#eef0ff",
    inkSoft: "#b0aee0",
    inkFaint: "#7e7cb0",
    line: "#3a3270",
    accent: "#59d22d",
    accentInk: "#0d1408",
    accentSoft: "#1f3a14",
  },
  type: {
    display: "'Courier New', monospace",
    body: "'Courier New', monospace",
    mono: "'Courier New', monospace",
    scale: 1,
  },
  surface: {
    cardStyle: "flat",
    radius: "0px",
    border: "heavy",
    shadow: "hard",
  },
  motion: {
    duration: 0.18,
    easing: "linear",
    stagger: 0.02,
    density: "lively",
  },
  decorative: {
    slots: ["scanlines"],
  },
};
