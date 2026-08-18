"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSurprise, type SurpriseResult } from "./actions/surprise";
import { useMotionTokens } from "@/lib/theme/motion-context";

export function SurpriseMe({
  className,
  buttonClassName,
  resultClassName,
}: {
  className?: string;
  buttonClassName?: string;
  resultClassName?: string;
}) {
  const [result, setResult] = useState<SurpriseResult | { error: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const motionTokens = useMotionTokens();

  function roll() {
    startTransition(async () => {
      setResult(await getSurprise());
    });
  }

  return (
    <div className={className}>
      <button
        type="button"
        className={buttonClassName ?? "btn"}
        onClick={roll}
        disabled={pending}
      >
        {pending ? "Shuffling…" : result ? "Surprise me again" : "Surprise me"}
      </button>
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={"error" in result ? "error" : result.href + result.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: motionTokens.duration, ease: motionTokens.ease }}
            className={resultClassName ?? "stat-tile"}
            style={resultClassName ? undefined : { marginTop: 14, maxWidth: 420 }}
          >
            {"error" in result ? (
              <p style={{ margin: 0, fontStyle: "italic" }}>{result.error}</p>
            ) : (
              <>
                <div className="stat-tile-label">{result.type}</div>
                <Link href={result.href} style={{ fontWeight: 600, display: "block", margin: "4px 0 6px" }}>
                  {result.label}
                </Link>
                {result.snippet && (
                  <p style={{ margin: 0, fontSize: 13 }}>{result.snippet}</p>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
