import type { ThemeTokens } from "@/lib/theme/tokens";

// The only preset seeded in Phase 0. Remaining presets (Dark, Cyber, Cute,
// Editorial, Archive/Vintage, Retro/Pixel, Y2K, Organic, Futuristic,
// Terminal, Custom) land in Phase 3 once the theme engine itself is built.
export const minimalTheme: ThemeTokens = {
  colors: {
    bg: "#faf8f3",
    bgRaised: "#ffffff",
    bgSunk: "#f1ede3",
    ink: "#201d1a",
    inkSoft: "#55504a",
    inkFaint: "#777066",
    line: "#e6e0d3",
    accent: "#a8432c",
    accentInk: "#fff8f2",
    accentSoft: "#f3e1d8",
  },
  type: {
    display: "'Iowan Old Style', Georgia, serif",
    body: "-apple-system, 'Segoe UI', sans-serif",
    mono: "'SF Mono', Consolas, monospace",
    scale: 1,
  },
  surface: {
    cardStyle: "flat",
    radius: "10px",
    border: "hairline",
    shadow: "soft",
  },
  motion: {
    duration: 0.3,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    stagger: 0.045,
    density: "measured",
  },
  decorative: {
    slots: [],
  },
};
