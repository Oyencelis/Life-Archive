"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AskIcon, MenuIcon } from "@/components/shell/nav/icons";
import { useMotionTokens } from "@/lib/theme/motion-context";
import { AskChat } from "@/app/ai/AskChat";

export function AskBubble() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const motionTokens = useMotionTokens();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="ask-bubble-root" ref={rootRef}>
      <AnimatePresence>
        {open && (
          <motion.div
            className="ask-panel"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: motionTokens.duration * 0.6, ease: motionTokens.ease }}
          >
            <p className="ask-panel-eyebrow">Grounded in your archive only</p>
            <AskChat compact />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        className="ask-bubble"
        aria-expanded={open}
        aria-label={open ? "Close ask panel" : "Ask your archive"}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
      >
        {open ? <MenuIcon open /> : <AskIcon />}
      </motion.button>
    </div>
  );
}
