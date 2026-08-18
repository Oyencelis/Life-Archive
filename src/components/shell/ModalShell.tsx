"use client";

import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useMotionTokens } from "@/lib/theme/motion-context";

// The visual shell shared by both the routing-based Modal (used for
// full entity create/edit flows via intercepted routes) and any
// locally-toggled modal (used where a route isn't involved, e.g. the
// lighter Interests/Goals/Writings "+ Add" forms) — same look everywhere.
export function ModalShell({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const motionTokens = useMotionTokens();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal-panel"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: motionTokens.duration, ease: motionTokens.ease }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        {children}
      </motion.div>
    </div>
  );
}
