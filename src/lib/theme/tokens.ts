// Theme token schema — see architecture blueprint §4.
// A theme is data (stored in the `themes` table as JSON), never a hardcoded
// stylesheet. Every preset and every user-built custom theme conforms to
// this shape so ThemeProvider can apply any of them the same way.

export interface ThemeTokens {
  colors: {
    bg: string;
    bgRaised: string;
    bgSunk: string;
    ink: string;
    inkSoft: string;
    inkFaint: string;
    line: string;
    accent: string;
    accentInk: string;
    accentSoft: string;
  };
  type: {
    display: string;
    body: string;
    mono: string;
    scale: number; // multiplier applied to the base type scale
  };
  surface: {
    cardStyle: "flat" | "index-card" | "terminal" | "soft" | "polaroid";
    radius: string;
    border: "none" | "hairline" | "heavy" | "dashed";
    shadow: "none" | "soft" | "hard";
  };
  motion: {
    duration: number; // seconds, base transition length
    easing: string; // CSS easing function or named GSAP ease
    stagger: number; // seconds between staggered children
    density: "quiet" | "measured" | "lively";
  };
  decorative: {
    slots: string[]; // named decorative components a theme opts into
  };
}

export interface ThemeRecord {
  id: string;
  key: string;
  name: string;
  isPreset: boolean;
  tokens: ThemeTokens;
}
