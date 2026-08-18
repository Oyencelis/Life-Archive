import type { ThemeTokens } from "@/lib/theme/tokens";

export const futuristicTheme: ThemeTokens = {
  colors: {
    bg: "#f4f8fb",
    bgRaised: "#ffffff",
    bgSunk: "#e5edf4",
    ink: "#14202b",
    inkSoft: "#48586a",
    inkFaint: "#5f7286",
    line: "#d6e2ec",
    accent: "#145ce9",
    accentInk: "#f4f8ff",
    accentSoft: "#dde8fc",
  },
  type: {
    display: "'Segoe UI', system-ui, sans-serif",
    body: "-apple-system, 'Segoe UI', sans-serif",
    mono: "'Cascadia Code', Consolas, monospace",
    scale: 0.98,
  },
  surface: {
    cardStyle: "flat",
    radius: "4px",
    border: "hairline",
    shadow: "soft",
  },
  motion: {
    duration: 0.22,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    stagger: 0.03,
    density: "lively",
  },
  decorative: {
    slots: ["scan-line-thin"],
  },
};
