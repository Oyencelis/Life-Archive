import type { ThemeTokens } from "@/lib/theme/tokens";

export const cyberTheme: ThemeTokens = {
  colors: {
    bg: "#0a0e14",
    bgRaised: "#11161f",
    bgSunk: "#070a0f",
    ink: "#d8f4ff",
    inkSoft: "#8fb3c4",
    inkFaint: "#647f8f",
    line: "#1f2e38",
    accent: "#00e5c7",
    accentInk: "#04141a",
    accentSoft: "#0d2b28",
  },
  type: {
    display: "'Segoe UI', system-ui, sans-serif",
    body: "-apple-system, 'Segoe UI', sans-serif",
    mono: "'Cascadia Code', 'SF Mono', Consolas, monospace",
    scale: 0.98,
  },
  surface: {
    cardStyle: "terminal",
    radius: "2px",
    border: "heavy",
    shadow: "hard",
  },
  motion: {
    duration: 0.2,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    stagger: 0.03,
    density: "lively",
  },
  decorative: {
    slots: ["grid-overlay"],
  },
};
