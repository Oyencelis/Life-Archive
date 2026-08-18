"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionTokens } from "@/lib/theme/motion-context";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const motionTokens = useMotionTokens();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: motionTokens.duration * 0.75, ease: motionTokens.ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
