"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { askArchive } from "./actions";
import { useMotionTokens } from "@/lib/theme/motion-context";
import type { CitedRecord } from "@/lib/ai/types";

interface Message {
  role: "user" | "assistant";
  text: string;
  citations?: CitedRecord[];
  grounded?: boolean;
  error?: boolean;
}

export function AskChat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const logRef = useRef<HTMLDivElement>(null);
  const motionTokens = useMotionTokens();

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  function send() {
    const question = input.trim();
    if (!question || pending) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    startTransition(async () => {
      const result = await askArchive(question);
      if ("error" in result) {
        setMessages((m) => [...m, { role: "assistant", text: result.error, error: true }]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: result.answer,
            citations: result.citations,
            grounded: result.grounded,
          },
        ]);
      }
    });
  }

  return (
    <div className={compact ? "ask-chat ask-chat-compact" : "ask-chat"}>
      <div className="ask-chat-log" ref={logRef}>
        {messages.length === 0 && (
          <p className="ask-chat-empty">
            Ask about anything in your archive — people, memories, journal entries, projects.
            If it isn&apos;t archived, you&apos;ll be told so, not given a guess.
          </p>
        )}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            className={`ask-message ask-message-${m.role}${m.error ? " ask-message-error" : ""}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionTokens.duration * 0.6, ease: motionTokens.ease }}
          >
            <p>{m.text}</p>
            {m.citations && m.citations.length > 0 && (
              <div className="ask-citations">
                {m.citations.map((c) => (
                  <Link key={`${c.type}-${c.id}`} href={c.href} className="tag-chip">
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
            {m.grounded === false && !m.error && (
              <p className="ask-message-note">Nothing in your archive matched this question.</p>
            )}
          </motion.div>
        ))}
        {pending && <div className="ask-message ask-message-assistant ask-message-pending">Thinking…</div>}
      </div>
      <form
        className="ask-chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your archive…"
          aria-label="Ask your archive"
          disabled={pending}
        />
        <button type="submit" className="btn btn-primary" disabled={pending || !input.trim()}>
          Ask
        </button>
      </form>
    </div>
  );
}
