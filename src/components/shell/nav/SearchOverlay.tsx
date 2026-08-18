"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { searchArchive, type SearchResultGroup } from "@/app/search/actions";
import { useMotionTokens } from "@/lib/theme/motion-context";
import { SearchIcon } from "./icons";

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const motionTokens = useMotionTokens();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setGroups([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        setGroups(await searchArchive(value));
      });
    }, 250);
  }

  const totalResults = groups.reduce((sum, g) => sum + g.results.length, 0);

  return (
    <div className="search-overlay-root" ref={rootRef}>
      <button
        type="button"
        className="nav-icon-btn"
        aria-label="Search"
        onClick={() => setOpen((v) => !v)}
      >
        <SearchIcon />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="search-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: motionTokens.duration * 0.6, ease: motionTokens.ease }}
          >
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Search your archive…"
              aria-label="Search your archive"
              className="search-panel-input"
            />
            <div className="search-panel-results">
              {!query.trim() ? (
                <p className="ask-chat-empty">
                  Search across people, memories, journal, places, events, projects, and writings.
                </p>
              ) : pending ? (
                <p className="ask-chat-empty">Searching…</p>
              ) : totalResults === 0 ? (
                <p className="ask-chat-empty">Nothing matched &ldquo;{query}&rdquo;.</p>
              ) : (
                groups.map((group) => (
                  <div key={group.label} className="search-panel-group">
                    <p className="page-header-eyebrow" style={{ marginBottom: 6 }}>
                      {group.label}
                    </p>
                    {group.results.map((r) => (
                      <Link
                        key={r.id}
                        href={r.href}
                        className="search-panel-result"
                        onClick={() => setOpen(false)}
                      >
                        <span>{r.title}</span>
                        {r.meta && <span className="record-row-meta">{r.meta}</span>}
                      </Link>
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
