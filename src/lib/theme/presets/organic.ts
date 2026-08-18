import type { ThemeTokens } from "@/lib/theme/tokens";

export const organicTheme: ThemeTokens = {
  colors: {
    bg: "#f4f1e6",
    bgRaised: "#fbf9f0",
    bgSunk: "#e7e1cd",
    ink: "#2b3a2c",
    inkSoft: "#556653",
    inkFaint: "#657060",
    line: "#dbd4b8",
    accent: "#4f6942",
    accentInk: "#f5f8ef",
    accentSoft: "#e1ead7",
  },
  type: {
    display: "'Palatino Linotype', Palatino, serif",
    body: "'Trebuchet MS', sans-serif",
    mono: "'SF Mono', Consolas, monospace",
    scale: 1,
  },
  surface: {
    cardStyle: "soft",
    radius: "16px",
    border: "hairline",
    shadow: "soft",
  },
  motion: {
    duration: 0.4,
    easing: "ease-in-out",
    stagger: 0.06,
    density: "measured",
  },
  decorative: {
    slots: ["leaf-corner"],
  },
};
