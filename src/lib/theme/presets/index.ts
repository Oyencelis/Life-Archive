import type { ThemeTokens } from "@/lib/theme/tokens";
import { minimalTheme } from "./minimal";
import { midnightTheme } from "./midnight";
import { cyberTheme } from "./cyber";
import { cuteTheme } from "./cute";
import { editorialTheme } from "./editorial";
import { archiveTheme } from "./archive";
import { pixelTheme } from "./pixel";
import { y2kTheme } from "./y2k";
import { organicTheme } from "./organic";
import { futuristicTheme } from "./futuristic";
import { terminalTheme } from "./terminal";

export interface ThemePreset {
  key: string;
  name: string;
  description: string;
  tokens: ThemeTokens;
}

export const THEME_PRESETS: ThemePreset[] = [
  { key: "minimal", name: "Minimal", description: "Quiet, restrained, paper-toned.", tokens: minimalTheme },
  { key: "midnight", name: "Dark / Midnight", description: "Low-light, ink-blue accent.", tokens: midnightTheme },
  { key: "cyber", name: "Cyber", description: "Sharp, teal-on-black, terminal-adjacent.", tokens: cyberTheme },
  { key: "cute", name: "Cute", description: "Soft, blush, bouncy motion.", tokens: cuteTheme },
  { key: "editorial", name: "Editorial", description: "Magazine serif, crimson rule.", tokens: editorialTheme },
  { key: "archive", name: "Archive / Vintage", description: "Aged paper, typewriter, stamped.", tokens: archiveTheme },
  { key: "pixel", name: "Retro / Pixel", description: "Arcade purple, hard block shadows.", tokens: pixelTheme },
  { key: "y2k", name: "Y2K", description: "Chrome, bubblegum, glossy curves.", tokens: y2kTheme },
  { key: "organic", name: "Organic / Nature", description: "Moss and sand, rounded and warm.", tokens: organicTheme },
  { key: "futuristic", name: "Futuristic", description: "Cool blue, crisp, precise.", tokens: futuristicTheme },
  { key: "terminal", name: "Terminal", description: "Phosphor green on black.", tokens: terminalTheme },
];
