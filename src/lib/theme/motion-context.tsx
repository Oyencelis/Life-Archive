"use client";

import { createContext, useContext, type ReactNode } from "react";
import { MotionConfig, type Easing } from "framer-motion";

export interface MotionValues {
  duration: number;
  stagger: number;
  ease: Easing;
}

const DEFAULT_MOTION: MotionValues = { duration: 0.3, stagger: 0.045, ease: "easeOut" };

const MotionThemeContext = createContext<MotionValues>(DEFAULT_MOTION);

// Theme motion tokens are stored as CSS-style strings ("ease-out",
// "cubic-bezier(...)") since they also drive plain CSS animations.
// Framer Motion wants its own keyword/tuple form, so translate once here.
function parseEasing(css: string): Easing {
  const bezier = css.match(/cubic-bezier\(([^)]+)\)/);
  if (bezier) {
    const parts = bezier[1].split(",").map((n) => parseFloat(n.trim()));
    if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
      const [x1, y1, x2, y2] = parts;
      return [x1, y1, x2, y2] as const;
    }
  }
  switch (css) {
    case "ease-in":
      return "easeIn";
    case "ease-in-out":
      return "easeInOut";
    case "linear":
      return "linear";
    case "ease-out":
    default:
      return "easeOut";
  }
}

export function MotionThemeProvider({
  duration,
  stagger,
  easing,
  children,
}: {
  duration: number;
  stagger: number;
  easing: string;
  children: ReactNode;
}) {
  const value: MotionValues = { duration, stagger, ease: parseEasing(easing) };
  return (
    <MotionThemeContext.Provider value={value}>
      {/* Every Framer Motion animation in the app respects the OS-level
          reduced-motion preference through this one wrapper — individual
          components don't need to check it themselves. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </MotionThemeContext.Provider>
  );
}

export function useMotionTokens() {
  return useContext(MotionThemeContext);
}
