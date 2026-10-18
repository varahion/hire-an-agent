"use client";

import { useId, useState } from "react";
import { useReduced } from "../interview/use-reduced";
import { SAMPLES } from "./samples";

export const PRIVACY_LINE =
  "Your example is sent to our AI provider to run this interview and kept only in the interview's session record, which we don't read, share or use for anything else. The interview closes after an hour.";

type Props = {
  initial: { job: string; example: string };
  busy: boolean;
  onSubmit: (input: { job: string; example: string }) => void;
};

const FLY_MS = 700;

/** Screen 1: the chore and one real example, on sticky notes. */
export function ChoreForm({ initial, busy, onSubmit }: Props) {
  const [job, setJob] = useState(initial.job);
  const [example, setExample] = useState(initial.example);
  const [error, setError] = useState("");
  const [flying, setFlying] = useState(false);
  const reduced = useReduced();
  const jobId = useId();
  const exampleId = useId();

  const submit = () => {
    if (busy || flying) return;
    if (job.trim().length < 3)
      return setError("Write the chore in a few words, or try a sample.");
    if (example.trim().length < 20)
      return setError(
        "Paste one real example: a message, email or note this chore starts with.",
      );
    const input = { job: job.trim(), example: example.trim() };
    if (reduced) return onSubmit(input);
    setFlying(true);
    window.setTimeout(() => onSubmit(input), FLY_MS);
  };

  return (
    <form
      className="mx-auto grid max-w-[520px] gap-3.5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-wrap justify-center gap-2">
        <p className="w-full text-center text-[13px] text-muted-foreground">
          Try a sample
        </p>
        {SAMPLES.map((sample, i) => (
          <button
            key={sample.label}
            type="button"
            onClick={() => {
              setJob(sample.job);
              setExample(sample.example);
              setError("");
            }}
            style={{ rotate: `${[-2, 1.5, -1][i % 3]}deg` }}
            className="rounded-[3px] bg-note px-3 py-1.5 text-sm text-note-ink transition-transform hover:-translate-y-0.5"
          >
            {sample.label}
          </button>
        ))}
      </div>

      <div className="vara-note -rotate-[1.2deg]">
        <div className="flex items-baseline justify-between">
          <label htmlFor={jobId} className="font-display font-medium">
            The chore
          </label>
          <span className="font-mono text-xs tabular-nums opacity-70">
            {job.length}/200
          </span>
        </div>
        <input
          id={jobId}
          value={job}
          maxLength={200}
          autoComplete="off"
          onChange={(e) => {
            setJob(e.target.value);
            setError("");
          }}
          placeholder="Replies to cake orders every morning"
          className="mt-1 text-lg"
        />
      </div>

      <div
        className={`vara-note rotate-[0.8deg] ${flying ? "vara-fly" : ""}`}
      >
        <div className="flex items-baseline justify-between">
          <label htmlFor={exampleId} className="font-display font-medium">
            One real example
          </label>
          <span className="font-mono text-xs tabular-nums opacity-70">
            {example.length}/3000
          </span>
        </div>
        <textarea
          id={exampleId}
          value={example}
          maxLength={3000}
          rows={5}
          onChange={(e) => {
            setExample(e.target.value);
            setError("");
          }}
          placeholder="Hi! Could I order a chocolate cake for about 20 people this Saturday? It's for my daughter's birthday. Thanks, Priya"
          className="mt-1 resize-y leading-relaxed"
        />
      </div>

      <p className="mx-auto max-w-[52ch] text-center text-[13px] leading-relaxed text-muted-foreground">
        {PRIVACY_LINE}
      </p>
      <p className="min-h-5 text-center text-sm text-accent-ink" role="alert">
        {error}
      </p>
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={busy || flying}
          className="rounded-full bg-foreground px-6 py-3 font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          Feed it to Vara
        </button>
      </div>
    </form>
  );
}
