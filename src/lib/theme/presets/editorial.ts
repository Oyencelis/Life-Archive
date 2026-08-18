import type { ThemeTokens } from "@/lib/theme/tokens";

export const editorialTheme: ThemeTokens = {
  colors: {
    bg: "#f7f5f0",
    bgRaised: "#ffffff",
    bgSunk: "#ece9e1",
    ink: "#181614",
    inkSoft: "#4c4844",
    inkFaint: "#746e67",
    line: "#ddd8cd",
    accent: "#b3273c",
    accentInk: "#fdf6f2",
    accentSoft: "#f3e0e0",
  },
  type: {
    display: "Georgia, 'Times New Roman', serif",
    body: "Georgia, 'Times New Roman', serif",
    mono: "'SF Mono', Consolas, monospace",
    scale: 1.05,
  },
  surface: {
    cardStyle: "flat",
    radius: "2px",
    border: "hairline",
    shadow: "none",
  },
  motion: {
    duration: 0.3,
    easing: "ease-out",
    stagger: 0.04,
    density: "quiet",
  },
  decorative: {
    slots: ["rule-lines"],
  },
};
