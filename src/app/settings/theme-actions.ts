"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import type { ThemeTokens } from "@/lib/theme/tokens";

export async function setActiveTheme(themeId: string) {
  const session = await requireSession();
  const theme = await prisma.theme.findFirst({
    where: { id: themeId, OR: [{ isPreset: true }, { userId: session.user.id }] },
  });
  if (!theme) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeThemeId: theme.id },
  });
  revalidatePath("/", "layout");
}

const TYPE_PRESETS: Record<string, { display: string; body: string; mono: string }> = {
  serif: {
    display: "'Iowan Old Style', Georgia, serif",
    body: "-apple-system, 'Segoe UI', sans-serif",
    mono: "'SF Mono', Consolas, monospace",
  },
  mono: {
    display: "Consolas, 'Cascadia Code', monospace",
    body: "Consolas, 'Cascadia Code', monospace",
    mono: "Consolas, 'Cascadia Code', monospace",
  },
  sans: {
    display: "'Segoe UI', system-ui, sans-serif",
    body: "-apple-system, 'Segoe UI', sans-serif",
    mono: "'Cascadia Code', Consolas, monospace",
  },
  cursive: {
    display: "'Segoe Print', 'Comic Sans MS', cursive",
    body: "-apple-system, 'Segoe UI', sans-serif",
    mono: "'SF Mono', Consolas, monospace",
  },
};

const DENSITY_MOTION: Record<string, { duration: number; stagger: number; easing: string }> = {
  quiet: { duration: 0.35, stagger: 0.045, easing: "ease-out" },
  measured: { duration: 0.28, stagger: 0.04, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
  lively: { duration: 0.2, stagger: 0.025, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
};

const CustomThemeSchema = z.object({
  bg: z.string(),
  bgRaised: z.string(),
  bgSunk: z.string(),
  ink: z.string(),
  inkSoft: z.string(),
  inkFaint: z.string(),
  line: z.string(),
  accent: z.string(),
  accentInk: z.string(),
  accentSoft: z.string(),
  typePreset: z.string(),
  radius: z.string(),
  border: z.enum(["none", "hairline", "heavy", "dashed"]),
  shadow: z.enum(["none", "soft", "hard"]),
  density: z.enum(["quiet", "measured", "lively"]),
});

export async function saveCustomTheme(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();
  const parsed = CustomThemeSchema.safeParse({
    bg: formData.get("bg"),
    bgRaised: formData.get("bgRaised"),
    bgSunk: formData.get("bgSunk"),
    ink: formData.get("ink"),
    inkSoft: formData.get("inkSoft"),
    inkFaint: formData.get("inkFaint"),
    line: formData.get("line"),
    accent: formData.get("accent"),
    accentInk: formData.get("accentInk"),
    accentSoft: formData.get("accentSoft"),
    typePreset: formData.get("typePreset"),
    radius: formData.get("radius"),
    border: formData.get("border"),
    shadow: formData.get("shadow"),
    density: formData.get("density"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;
  const type = TYPE_PRESETS[d.typePreset] ?? TYPE_PRESETS.serif;
  const motion = DENSITY_MOTION[d.density];

  const tokens: ThemeTokens = {
    colors: {
      bg: d.bg,
      bgRaised: d.bgRaised,
      bgSunk: d.bgSunk,
      ink: d.ink,
      inkSoft: d.inkSoft,
      inkFaint: d.inkFaint,
      line: d.line,
      accent: d.accent,
      accentInk: d.accentInk,
      accentSoft: d.accentSoft,
    },
    type: { ...type, scale: 1 },
    surface: { cardStyle: "flat", radius: d.radius, border: d.border, shadow: d.shadow },
    motion: { duration: motion.duration, easing: motion.easing, stagger: motion.stagger, density: d.density },
    decorative: { slots: [] },
  };

  const existing = await prisma.theme.findFirst({
    where: { userId: session.user.id, key: "custom" },
  });

  const theme = existing
    ? await prisma.theme.update({
        where: { id: existing.id },
        data: { tokens: tokens as object },
      })
    : await prisma.theme.create({
        data: {
          userId: session.user.id,
          key: "custom",
          name: "Custom",
          isPreset: false,
          tokens: tokens as object,
        },
      });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeThemeId: theme.id },
  });

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { success: true };
}
