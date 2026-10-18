"use client";

import { useId, useState } from "react";

export type QA = {
  question: string;
  answer: string;
  done: boolean;
  failed?: boolean;
};

const SUGGESTED = [
  "What would you need access to?",
  "What wouldn't you do without me?",
  "How would you handle a tricky case?",
];

export const MAX_QUESTIONS = 3;

type Props = {
  turns: QA[];
  busy: boolean;
  onAsk: (question: string) => void;
  /** Done asking: go to the double-check. */
  onCard: () => void;
};

function VaraBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex max-w-[92%] items-start gap-2">
      <i
        aria-hidden
        className="mt-0.5 h-[26px] w-[22px] flex-none rounded-[50%_50%_46%_46%] bg-accent-vermilion"
      />
      <p className="rounded-[14px_14px_14px_4px] bg-vara-soft px-3 py-2 text-[15px] leading-relaxed">
        {children}
      </p>
    </div>
  );
}

/** Screen 3: ask Vara up to three questions, chat style. */
export function InterviewView({ turns, busy, onAsk, onCard }: Props) {
  const [draft, setDraft] = useState("");
  const inputId = useId();
  const left = MAX_QUESTIONS - turns.length;
  const unasked = SUGGESTED.filter((q) => !turns.some((t) => t.question === q));
  const ask = (question: string) => {
    if (busy || left <= 0 || question.trim().length < 3) return;
    onAsk(question.trim());
    setDraft("");
  };

  return (
    <section className="mx-auto grid max-w-[520px] gap-3.5">
      <div className="grid gap-2.5 rounded-xl border border-border bg-card px-4 py-3.5">
        <VaraBubble>
          Ask me up to 3 questions about this chore, or skip straight to the
          double-check.
        </VaraBubble>
        {turns.map((turn, i) => (
          <div key={i} className="grid gap-2.5">
            <p className="max-w-[85%] justify-self-end rounded-[14px_14px_4px_14px] bg-foreground px-3 py-2 text-[15px] text-background">
              {turn.question}
            </p>
            <VaraBubble>
              {turn.answer ||
                (turn.failed
                  ? "No answer this time. This question still counts towards your three."
                  : "Thinking about it…")}
            </VaraBubble>
          </div>
        ))}
      </div>

      {left > 0 && (
        <>
          <div className="flex flex-wrap justify-center gap-2">
            {unasked.map((q, i) => (
              <button
                key={q}
                type="button"
                disabled={busy}
                onClick={() => ask(q)}
                style={{ rotate: `${i % 2 ? 1.5 : -1.5}deg` }}
                className="rounded-[3px] bg-note px-3 py-1.5 text-sm text-note-ink transition-transform hover:-translate-y-0.5 disabled:opacity-40"
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
              autoComplete="off"
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Or ask your own question"
              className="min-w-0 flex-1 rounded-full border-[1.5px] border-border bg-card px-4 py-2.5 outline-none focus:border-foreground"
            />
            <button
              type="submit"
              disabled={busy || draft.trim().length < 3}
              className="rounded-full border-[1.5px] border-foreground px-5 font-medium disabled:opacity-40"
            >
              Ask
            </button>
          </form>
        </>
      )}
      <p className="text-center text-[13px] text-muted-foreground">
        {left > 0
          ? `${left} ${left === 1 ? "question" : "questions"} left`
          : "That's the interview."}
      </p>
      <div className="flex justify-center">
        <button
          type="button"
          disabled={busy}
          onClick={onCard}
          className="rounded-full bg-foreground px-6 py-3 font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          Done asking, double-check it
        </button>
      </div>
    </section>
  );
}
