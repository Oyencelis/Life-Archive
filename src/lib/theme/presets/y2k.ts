import type { ThemeTokens } from "@/lib/theme/tokens";

export const y2kTheme: ThemeTokens = {
  colors: {
    bg: "#eaf6ff",
    bgRaised: "#ffffff",
    bgSunk: "#d9edfb",
    ink: "#14294d",
    inkSoft: "#3e5580",
    inkFaint: "#556f9d",
    line: "#c3ddf2",
    accent: "#c40067",
    accentInk: "#ffffff",
    accentSoft: "#ffdcef",
  },
  type: {
    display: "Verdana, Geneva, sans-serif",
    body: "'Trebuchet MS', sans-serif",
    mono: "Consolas, monospace",
    scale: 1,
  },
  surface: {
    cardStyle: "polaroid",
    radius: "20px",
    border: "none",
    shadow: "soft",
  },
  motion: {
    duration: 0.35,
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    stagger: 0.05,
    density: "lively",
  },
  decorative: {
    slots: ["chrome-shine"],
  },
};
