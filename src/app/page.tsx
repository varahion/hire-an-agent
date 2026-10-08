"use client";

import { useCallback, useRef, useState } from "react";
import { CardView } from "@/components/interview/card-view";
import { DescribeForm } from "@/components/interview/describe-form";
import { InterviewView, type QA } from "@/components/interview/interview-view";
import { postStream } from "@/components/interview/use-ndjson";
import { LiveStatus, WorkingView } from "@/components/interview/working-view";
import type { CardResult, WorkResult } from "@/lib/schemas";
import type { AppEvent } from "@/lib/stream";

type Stage = "describe" | "working" | "interview" | "card";
type Notice = { kind: "error" | "limit"; text: string } | null;

const ASSESSMENT_URL = process.env.NEXT_PUBLIC_VARAHION_ASSESSMENT_URL;

const LIMIT_TEXT = {
  visitor: "You've run three interviews today. Come back tomorrow, or tell Varahion about the job directly.",
  global: "The tool is at its daily limit. Come back tomorrow, or tell Varahion about the job directly.",
  questions: "That's three questions. Get the CV card to finish the interview.",
} as const;

const STEPS: { id: Stage; label: string }[] = [
  { id: "describe", label: "Describe the job" },
  { id: "interview", label: "Interview" },
  { id: "card", label: "CV card" },
];

function Progress({ stage }: { stage: Stage }) {
  const current = stage === "working" ? "interview" : stage;
  const index = STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="flex gap-6 text-sm" aria-label="Progress">
      {STEPS.map((step, i) => (
        <li
          key={step.id}
          aria-current={i === index ? "step" : undefined}
          className={i === index ? "font-medium text-foreground" : i < index ? "text-foreground" : "text-muted-foreground"}
        >
          {step.label}
        </li>
      ))}
    </ol>
  );
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("describe");
  const [input, setInput] = useState({ job: "", example: "" });
  const [status, setStatus] = useState("Reading your example…");
  const [work, setWork] = useState<WorkResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [turns, setTurns] = useState<QA[]>([]);
  const [card, setCard] = useState<{ data: CardResult; shareToken: string } | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  // One request at a time: ignore double clicks while a turn is in flight.
  const run = useCallback(async (task: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await task();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const handleCommon = (event: AppEvent): boolean => {
    if (event.type === "status") setStatus(event.text);
    else if (event.type === "limit") setNotice({ kind: "limit", text: LIMIT_TEXT[event.reason] });
    else if (event.type === "error") setNotice({ kind: "error", text: event.message });
    else return false;
    return true;
  };

  const start = (next: { job: string; example: string }) =>
    run(async () => {
      setInput(next);
      setNotice(null);
      setWork(null);
      setRevealed(false);
      setTurns([]);
      setCard(null);
      setStatus("Reading your example…");
      setStage("working");
      let ok = false;
      await postStream("/api/work", next, (event) => {
        if (handleCommon(event)) return;
        if (event.type === "result") {
          ok = true;
          setWork(event.data as WorkResult);
        }
      });
      if (!ok) setStage("describe");
    });

  const ask = (question: string) =>
    run(async () => {
      setNotice(null);
      setTurns((t) => [...t, { question, answer: "", done: false }]);
      await postStream("/api/ask", { question }, (event) => {
        if (handleCommon(event)) return;
        if (event.type === "delta")
          setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, answer: turn.answer + event.text } : turn)));
      });
      setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, done: true } : turn)));
    });

  const getCard = () =>
    run(async () => {
      setNotice(null);
      setStatus("Writing the CV card…");
      setStage("card");
      let ok = false;
      await postStream("/api/card", {}, (event) => {
        if (handleCommon(event)) return;
        if (event.type === "result" && event.shareToken) {
          ok = true;
          setCard({ data: event.data as CardResult, shareToken: event.shareToken });
        }
      });
      if (!ok) setStage("interview");
    });

  const restart = () => {
    setStage("describe");
    setWork(null);
    setTurns([]);
    setCard(null);
    setNotice(null);
  };

  const onRevealed = useCallback(() => {
    setRevealed(true);
    setStage((s) => (s === "working" ? "interview" : s));
  }, []);

  return (
    <main className="mx-auto max-w-[680px] px-4 pb-24 pt-10 sm:pt-16">
      <header className="flex items-baseline justify-between gap-4">
        <p className="font-semibold tracking-tight">Hire an Agent</p>
        <p className="text-sm text-muted-foreground">A free tool by Varahion</p>
      </header>

      <div className="mt-14 sm:mt-20">
        <h1 className="max-w-[16ch] text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Interview an AI for the job you repeat every week.
        </h1>
        <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-muted-foreground">
          Describe the task, paste one real example, and watch the candidate do it. Then ask it anything and keep its CV.
        </p>
      </div>

      <div className="mt-10">
        <Progress stage={stage} />
      </div>

      {notice && (
        <div role="alert" className={`mt-6 border-l-2 pl-4 ${notice.kind === "error" ? "border-accent-vermilion" : "border-foreground"}`}>
          <p>{notice.text}</p>
          {ASSESSMENT_URL && notice.kind === "limit" && (
            <a href={ASSESSMENT_URL} className="mt-1 inline-block text-sm underline underline-offset-4">
              Tell Varahion about the job
            </a>
          )}
        </div>
      )}

      <div className="mt-8 space-y-14">
        {stage === "describe" && <DescribeForm initial={input} busy={busy} onSubmit={start} />}

        {stage !== "describe" && (
          <>
            <div className="border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">The job</p>
              <p className="mt-1 font-medium">{input.job}</p>
            </div>
            <WorkingView result={work} status={status} onRevealed={onRevealed} />
          </>
        )}

        {work?.declined && (
          <button type="button" onClick={restart} className="text-sm underline underline-offset-4">
            Try a different job
          </button>
        )}

        {revealed && !work?.declined && (stage === "interview" || stage === "card") && (
          <InterviewView turns={turns} busy={busy} finished={stage === "card"} onAsk={ask} onCard={getCard} />
        )}

        {stage === "card" && !card && <LiveStatus text={status} />}
        {stage === "card" && card && <CardView card={card.data} shareToken={card.shareToken} onRestart={restart} />}
      </div>
    </main>
  );
}
