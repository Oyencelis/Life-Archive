import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { minimalTheme } from "@/lib/theme/presets/minimal";
import type { ThemeTokens } from "@/lib/theme/tokens";

export interface ActiveTheme {
  key: string;
  tokens: ThemeTokens;
}

export async function getActiveTheme(): Promise<ActiveTheme> {
  const session = await auth();

  // Pre-login pages (login, setup) have no session to key a theme lookup
  // off of. This is a single-owner app — there's only ever one account —
  // so falling back to that account's own theme (rather than always the
  // "minimal" default) is what makes the sign-in page actually reflect
  // the theme its owner picked, instead of ignoring it entirely.
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { activeTheme: { select: { key: true, tokens: true } } },
      })
    : await prisma.user.findFirst({
        select: { activeTheme: { select: { key: true, tokens: true } } },
      });

  if (!user?.activeTheme) return { key: "minimal", tokens: minimalTheme };
  return {
    key: user.activeTheme.key,
    tokens: user.activeTheme.tokens as unknown as ThemeTokens,
  };
}
