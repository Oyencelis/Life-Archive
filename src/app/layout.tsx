import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "@/components/shell/nav/AppNav";
import { AskBubble } from "@/components/ai/AskBubble";
import { PageTransition } from "@/components/shell/PageTransition";
import { auth } from "@/lib/auth";
import { getActiveTheme } from "@/lib/theme/get-active-theme";
import { tokensToCssVariables } from "@/lib/theme/css-vars";
import { MotionThemeProvider } from "@/lib/theme/motion-context";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Archive",
  description: "A private, database-driven personal life archive.",
};

export default async function RootLayout({
  children,
  modal,
}: LayoutProps<"/"> & { modal: ReactNode }) {
  const [{ key, tokens }, session] = await Promise.all([getActiveTheme(), auth()]);

  return (
    <html lang="en" className="h-full antialiased" data-theme-key={key}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: tokensToCssVariables(tokens) }} />
      </head>
      <body className="min-h-full flex flex-col">
        <MotionThemeProvider
          duration={tokens.motion.duration}
          stagger={tokens.motion.stagger}
          easing={tokens.motion.easing}
        >
          <AppNav />
          <div className="app-body">
            <PageTransition>{children}</PageTransition>
          </div>
          {modal}
          {session?.user && <AskBubble />}
        </MotionThemeProvider>
      </body>
    </html>
  );
}
