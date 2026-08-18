"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Clamps long prose to a handful of lines with a toggle to expand — the
// button only renders if the text actually overflows the clamp, checked
// once on mount while still collapsed (that's the one moment clientHeight
// reflects the clamped box rather than the full expanded one).
export function ReadMore({ children, clampLines = 6 }: { children: ReactNode; clampLines?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div
        ref={ref}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: clampLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {children}
      </div>
      {overflowing && (
        <button type="button" className="ed-readmore-btn" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
