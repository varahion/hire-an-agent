"use client";

import { useId, useState } from "react";
import { LiveStatus } from "./working-view";

export type QA = { question: string; answer: string; done: boolean };

const SUGGESTED = [
  "What would you need access to?",
  "What wouldn't you do without me?",
  "How would you handle a tricky case?",
];

export const MAX_QUESTIONS = 3;

type Props = {
  turns: QA[];
  busy: boolean;
  /** The card has been requested: show the transcript only. */
  finished: boolean;
  onAsk: (question: string) => void;
  onCard: () => void;
};

export function InterviewView({ turns, busy, finished, onAsk, onCard }: Props) {
  const [draft, setDraft] = useState("");
  const inputId = useId();
  const asked = turns.length;
  const left = MAX_QUESTIONS - asked;
  const unasked = SUGGESTED.filter((q) => !turns.some((t) => t.question === q));
  const ask = (question: string) => {
    if (busy || left <= 0 || question.trim().length < 3) return;
    onAsk(question.trim());
    setDraft("");
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Interview the candidate
        </h2>
        {!finished && (
          <p className="mt-1 text-muted-foreground">
            {left > 0
              ? `Ask up to ${left} more ${left === 1 ? "question" : "questions"}, or go straight to the CV card.`
              : "That's the interview. Ready for the CV card."}
          </p>
        )}
      </div>

      {turns.map((turn) => (
        <div key={turn.question} className="space-y-2">
          <p className="font-medium">{turn.question}</p>
          {turn.answer ? (
            <p
              className="border-l-2 border-accent-vermilion pl-4 leading-relaxed"
              aria-live={turn.done ? "polite" : "off"}
            >
              {turn.answer}
            </p>
          ) : (
            <LiveStatus text="Thinking about it…" />
          )}
        </div>
      ))}

      {!finished && left > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {unasked.map((q) => (
              <button
                key={q}
                type="button"
                disabled={busy}
                onClick={() => ask(q)}
                className="border border-border px-3 py-1.5 text-sm transition-colors hover:border-foreground disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              ask(draft);
            }}
          >
            <label htmlFor={inputId} className="sr-only">
              Your own question
            </label>
            <input
              id={inputId}
              value={draft}
              maxLength={300}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Or ask your own question"
              className="min-w-0 flex-1 border border-border bg-white/60 px-3 py-2 outline-none focus:border-foreground"
            />
            <button
              type="submit"
              disabled={busy || draft.trim().length < 3}
              className="border border-foreground px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Ask
            </button>
          </form>
        </div>
      )}

      {!finished && (
        <button
          type="button"
          disabled={busy}
          onClick={onCard}
          className="bg-foreground px-5 py-3 font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          Get the CV card
        </button>
      )}
    </section>
  );
}
