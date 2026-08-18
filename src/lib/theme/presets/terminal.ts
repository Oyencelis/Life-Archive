import type { ThemeTokens } from "@/lib/theme/tokens";

export const terminalTheme: ThemeTokens = {
  colors: {
    bg: "#05070a",
    bgRaised: "#0a0f0c",
    bgSunk: "#020403",
    ink: "#4fae68",
    inkSoft: "#3b8a51",
    inkFaint: "#3b8851",
    line: "#173322",
    accent: "#23c74c",
    accentInk: "#02110a",
    accentSoft: "#0e2418",
  },
  type: {
    display: "Consolas, 'Cascadia Code', monospace",
    body: "Consolas, 'Cascadia Code', monospace",
    mono: "Consolas, 'Cascadia Code', monospace",
    scale: 1,
  },
  surface: {
    cardStyle: "terminal",
    radius: "0px",
    border: "hairline",
    shadow: "none",
  },
  motion: {
    duration: 0.15,
    easing: "linear",
    stagger: 0.02,
    density: "lively",
  },
  decorative: {
    slots: ["scanlines", "cursor-blink"],
  },
};
