"use client";

import { useId, useState } from "react";

export const PRIVACY_LINE =
  "We use your example only to run this interview. It isn't saved by this tool or shown to anyone else, and the interview closes after an hour.";

type Props = {
  initial: { job: string; example: string };
  busy: boolean;
  onSubmit: (input: { job: string; example: string }) => void;
};

export function DescribeForm({ initial, busy, onSubmit }: Props) {
  const [job, setJob] = useState(initial.job);
  const [example, setExample] = useState(initial.example);
  const jobId = useId();
  const exampleId = useId();
  const tooShort = job.trim().length < 3 || example.trim().length < 20;

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy && !tooShort) onSubmit({ job: job.trim(), example: example.trim() });
      }}
    >
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={jobId} className="font-medium">
            The job
          </label>
          <span className="text-sm tabular-nums text-muted-foreground">{job.length}/200</span>
        </div>
        <input
          id={jobId}
          value={job}
          maxLength={200}
          onChange={(e) => setJob(e.target.value)}
          placeholder="Replies to cake orders every morning"
          className="mt-2 w-full border border-border bg-white/60 px-3 py-2.5 outline-none focus:border-foreground"
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={exampleId} className="font-medium">
            One real example
          </label>
          <span className="text-sm tabular-nums text-muted-foreground">{example.length}/3000</span>
        </div>
        <textarea
          id={exampleId}
          value={example}
          maxLength={3000}
          rows={7}
          onChange={(e) => setExample(e.target.value)}
          placeholder={"Hi! Could I order a chocolate cake for about 20 people this Saturday? It's for my daughter's birthday. Thanks, Priya"}
          className="mt-2 w-full resize-y border border-border bg-white/60 px-3 py-2.5 leading-relaxed outline-none focus:border-foreground"
        />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{PRIVACY_LINE}</p>
      <button
        type="submit"
        disabled={busy || tooShort}
        className="bg-foreground px-5 py-3 font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        Start the interview
      </button>
    </form>
  );
}
