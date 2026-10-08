"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { WorkResult } from "@/lib/schemas";
import { useReduced } from "./use-reduced";

/** Pulsing vermilion dot + mono status: the agent's live voice. */
export function LiveStatus({ text }: { text: string }) {
  return (
    <p
      className="flex items-center gap-2.5 font-mono text-sm text-accent-ink"
      role="status"
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-vermilion opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-vermilion" />
      </span>
      {text}
    </p>
  );
}

/** Reveal text character by character over at most `maxMs`; instant with reduced motion. */
function useTyped(
  text: string,
  start: boolean,
  reduced: boolean,
  maxMs = 1800,
): { shown: string; done: boolean } {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || reduced) return;
    const step = Math.max(4, Math.min(18, maxMs / Math.max(1, text.length)));
    const perTick = Math.max(1, Math.ceil(text.length / (maxMs / step)));
    const id = window.setInterval(() => {
      setCount((c) => {
        const next = Math.min(text.length, c + perTick);
        if (next >= text.length) window.clearInterval(id);
        return next;
      });
    }, step);
    return () => window.clearInterval(id);
  }, [text, start, reduced, maxMs]);
  if (reduced) return { shown: text, done: true };
  return { shown: text.slice(0, count), done: count >= text.length };
}

const STAGGER = 0.4;

export function WorkingView({
  result,
  status,
  onRevealed,
}: {
  result: WorkResult | null;
  status: string;
  onRevealed: () => void;
}) {
  const reduced = useReduced();
  const [draftStart, setDraftStart] = useState(false);

  useEffect(() => {
    if (!result) return;
    const delay = reduced ? 0 : STAGGER * 2 * 1000;
    const id = window.setTimeout(() => setDraftStart(true), delay);
    return () => window.clearTimeout(id);
  }, [result, reduced]);

  const typed = useTyped(result?.draft ?? "", draftStart, reduced);

  useEffect(() => {
    if (result && (result.declined || (draftStart && typed.done))) onRevealed();
  }, [result, draftStart, typed.done, onRevealed]);

  if (!result) return <LiveStatus text={status} />;

  const enter = (i: number) =>
    reduced
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.45,
            delay: i * STAGGER,
            ease: [0.2, 0.7, 0.2, 1] as const,
          },
        };

  if (result.declined)
    return (
      <motion.section
        {...enter(0)}
        className="border-l-2 border-accent-vermilion pl-5"
      >
        <h2 className="text-xl font-semibold tracking-tight">
          I&apos;d turn this job down.
        </h2>
        <p className="mt-3 leading-relaxed">{result.declined.reason}</p>
        <p className="mt-3 leading-relaxed">
          <span className="font-medium">What I could do instead: </span>
          {result.declined.suggestion}
        </p>
      </motion.section>
    );

  return (
    <section className="space-y-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <motion.div {...enter(0)}>
          <h2 className="font-medium">What I understood</h2>
          <ul className="mt-3 space-y-2 text-[15px] leading-snug">
            {result.understood.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </motion.div>
        <motion.div {...enter(1)}>
          <h2 className="font-medium">What&apos;s missing</h2>
          {result.missing.length ? (
            <ul className="mt-3 space-y-2 text-[15px] leading-snug">
              {result.missing.map((item) => (
                <li key={item} className="text-accent-ink">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[15px] text-muted-foreground">
              Nothing. Your example has what I need.
            </p>
          )}
        </motion.div>
      </div>
      <motion.div {...enter(2)}>
        <h2 className="font-medium">My draft, for your approval</h2>
        <div className="mt-3 border border-foreground bg-white/70 p-5 sm:p-6">
          <p
            className="whitespace-pre-wrap leading-relaxed"
            aria-hidden={!typed.done}
          >
            {typed.shown}
            {!typed.done && (
              <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.2em] animate-pulse bg-accent-vermilion" />
            )}
          </p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing has been sent. You decide what goes out.
        </p>
      </motion.div>
    </section>
  );
}
