import type { ThemeTokens } from "@/lib/theme/tokens";

export const archiveTheme: ThemeTokens = {
  colors: {
    bg: "#ece3cf",
    bgRaised: "#f6efe0",
    bgSunk: "#e0d5b8",
    ink: "#3b2f22",
    inkSoft: "#63533e",
    inkFaint: "#71634e",
    line: "#cdbf9c",
    accent: "#8a3324",
    accentInk: "#f8ece5",
    accentSoft: "#e6cdbf",
  },
  type: {
    display: "'Courier New', Courier, monospace",
    body: "Georgia, serif",
    mono: "'Courier New', Courier, monospace",
    scale: 1,
  },
  surface: {
    cardStyle: "index-card",
    radius: "2px",
    border: "dashed",
    shadow: "soft",
  },
  motion: {
    duration: 0.3,
    easing: "ease-out",
    stagger: 0.05,
    density: "measured",
  },
  decorative: {
    slots: ["paper-grain", "stamp-corners"],
  },
};
