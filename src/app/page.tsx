"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CardView } from "@/components/interview/card-view";
import { InterviewView, type QA } from "@/components/interview/interview-view";
import { postStream } from "@/components/interview/use-ndjson";
import { useReduced } from "@/components/interview/use-reduced";
import { WorkingView } from "@/components/interview/working-view";
import { CheckView } from "@/components/vara/check-view";
import { ChoreForm } from "@/components/vara/chore-form";
import { ORBIT_ICONS } from "@/components/vara/looks";
import { VaraProgress, type Stage } from "@/components/vara/progress";
import { VaraStage } from "@/components/vara/stage";
import type { VaraMood } from "@/components/vara/vara";
import { withCardDefaults } from "@/lib/card-display";
import { withBase } from "@/lib/paths";
import type { CardResult, WorkResult } from "@/lib/schemas";
import type { AppEvent } from "@/lib/stream";

type Notice = {
  kind: "error" | "limit";
  text: string;
  showAssessment: boolean;
} | null;

const ASSESSMENT_URL = process.env.NEXT_PUBLIC_VARAHION_ASSESSMENT_URL;

const LIMIT_TEXT = {
  visitor:
    "You've taught Vara three chores today. Come back tomorrow, or tell Varahion about the job directly.",
  global:
    "Vara is resting: the tool is at its daily limit. Come back tomorrow, or tell Varahion about the job directly.",
  questions: "That's three questions. Double-check what Vara learned to finish.",
  card: "That's all the changes for this Vara. Hatch it, or start a new chore.",
  session:
    "This session reached its limit. Start a new chore, or tell Varahion about the job directly.",
} as const;

// The first read-back plus two corrections: the server allows three cards a session.
const MAX_FIXES = 2;

const HERO: Record<Stage, { title: string; lede: string }> = {
  chore: {
    title: "Teach Vara a chore. Watch it hatch a helper.",
    lede: "Tell Vara a job you repeat every week, show it one real example, and watch it do the job. Then ask it anything and keep its card.",
  },
  trying: {
    title: "Vara is doing your chore",
    lede: "Watch it work on your example. Nothing is sent or connected.",
  },
  ask: {
    title: "Your turn: interview Vara",
    lede: "Ask it like a new starter. What it needs, what it won't do, a tricky case.",
  },
  check: {
    title: "Let's double-check",
    lede: "Vara reads back what it learned. Fix anything before it hatches.",
  },
  hatched: {
    title: "Meet your Vara",
    lede: "Your own Vara, trained on your chore. Keep its card, share it, or hire it for real.",
  },
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("chore");
  const [input, setInput] = useState({ job: "", example: "" });
  const [status, setStatus] = useState("Vara is hungry for a chore");
  const [work, setWork] = useState<WorkResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [turns, setTurns] = useState<QA[]>([]);
  const [card, setCard] = useState<{
    data: CardResult;
    shareToken: string;
  } | null>(null);
  const [previous, setPrevious] = useState<CardResult | undefined>();
  const [fixesUsed, setFixesUsed] = useState(0);
  const [hatching, setHatching] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [notice, setNotice] = useState<Notice>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  // One page-level live region: each completed block is announced once.
  const [announcement, setAnnouncement] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const reduced = useReduced();

  // Move focus to the new screen so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (stage === "hatched") cardRef.current?.focus();
    else if (stage !== "chore") headingRef.current?.focus();
  }, [stage]);
  useEffect(() => {
    if (revealed) nextRef.current?.focus();
  }, [revealed]);

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
    else if (event.type === "limit")
      setNotice({
        kind: "limit",
        text: LIMIT_TEXT[event.reason],
        showAssessment: event.reason !== "questions" && event.reason !== "card",
      });
    else if (event.type === "error")
      setNotice({
        kind: "error",
        text: event.message,
        showAssessment: event.code === "offline",
      });
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
      setStage("trying");
      let ok = false;
      await postStream(withBase("/api/work"), next, (event) => {
        if (handleCommon(event)) return;
        if (event.type === "result") {
          ok = true;
          setWork(event.data as WorkResult);
        }
      });
      if (!ok) {
        setStage("chore");
        setStatus("Vara is hungry for a chore");
      }
    });

  const ask = (question: string) =>
    run(async () => {
      setNotice(null);
      setTurns((t) => [...t, { question, answer: "", done: false }]);
      let answer = "";
      await postStream(withBase("/api/ask"), { question }, (event) => {
        if (handleCommon(event)) return;
        if (event.type === "delta") {
          answer += event.text;
          setTurns((t) =>
            t.map((turn, i) =>
              i === t.length - 1
                ? { ...turn, answer: turn.answer + event.text }
                : turn,
            ),
          );
        }
      });
      setTurns((t) =>
        t.map((turn, i) =>
          i === t.length - 1 ? { ...turn, done: true, failed: !answer } : turn,
        ),
      );
      setAnnouncement(answer ? `Answer: ${answer}` : "No answer this time.");
    });

  // The first read-back, or (with a correction) Vara's revised one.
  const getCard = (correction?: string) =>
    run(async () => {
      setNotice(null);
      setStage("check");
      const before = card?.data;
      let ok = false;
      await postStream(
        withBase("/api/card"),
        correction ? { correction } : {},
        (event) => {
          if (handleCommon(event)) return;
          if (event.type === "result" && event.shareToken) {
            ok = true;
            setPrevious(correction ? before : undefined);
            setCard({
              data: event.data as CardResult,
              shareToken: event.shareToken,
            });
          }
        },
      );
      if (ok && correction) setFixesUsed((n) => n + 1);
      if (ok) {
        // The stage's status line is a live region, so this is announced once.
        setStatus(correction ? "Fixed. Is it right now?" : "Vara is waiting for your OK");
      } else if (!before) setStage("ask");
    });

  const hatch = () =>
    run(async () => {
      if (!card) return;
      const vara = withCardDefaults(card.data);
      setNotice(null);
      setHatching(true);
      setStatus("Something's happening…");
      if (!reduced) await new Promise((r) => window.setTimeout(r, 1100));
      setHatching(false);
      setFlashKey((k) => k + 1);
      setStatus(`${vara.name} has hatched!`);
      setStage("hatched");
    });

  const restart = () => {
    setStage("chore");
    setStatus("Vara is hungry for a chore");
    setWork(null);
    setRevealed(false);
    setTurns([]);
    setCard(null);
    setPrevious(undefined);
    setFixesUsed(0);
    setFlashKey(0);
    setNotice(null);
  };

  const onRevealed = useCallback(() => {
    setRevealed(true);
    setStatus("Done! Here's my go at it.");
    setAnnouncement(
      "Vara's work is ready: what it understood, what's missing, and a draft for your approval.",
    );
  }, []);

  const vara = card ? withCardDefaults(card.data) : null;
  const working = stage === "trying" ? !revealed : busy && !hatching;
  const mood: VaraMood = hatching
    ? "cracking"
    : working
      ? "working"
      : "hungry";
  const orbit = working ? ORBIT_ICONS[vara?.look ?? "other"] : null;
  const hero =
    stage === "hatched" && vara
      ? { ...HERO.hatched, title: `Meet your ${vara.name}` }
      : HERO[stage];
  const shownStatus =
    stage === "trying" && revealed && work?.declined
      ? "Vara won't do this one"
      : status;

  return (
    <main className="mx-auto max-w-[720px] px-4 pb-24">
      <p className="sr-only" aria-live="polite" role="status">
        {announcement}
      </p>
      <header className="flex items-baseline justify-between gap-3 py-5">
        <p className="font-display text-xl font-bold tracking-tight">Vara</p>
        <p className="text-sm text-muted-foreground">by Varahion</p>
      </header>

      <div className="mt-7 text-center">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mx-auto max-w-[14ch] text-balance font-display text-[clamp(34px,7vw,58px)] font-bold leading-[1.02] tracking-tight outline-none"
        >
          {hero.title}
        </h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-balance text-muted-foreground">
          {hero.lede}
        </p>
      </div>

      <div className="mt-5">
        <VaraProgress stage={stage} />
      </div>

      <div className="mt-2">
        <VaraStage
          mood={mood}
          look={stage === "hatched" ? vara?.look : undefined}
          orbit={orbit}
          status={shownStatus}
          flashKey={flashKey}
        />
      </div>

      {notice && (
        <div
          role="alert"
          className={`mx-auto mt-4 max-w-[520px] border-l-2 pl-4 ${notice.kind === "error" ? "border-accent-vermilion" : "border-foreground"}`}
        >
          <p>{notice.text}</p>
          {ASSESSMENT_URL && notice.showAssessment && (
            <a
              href={ASSESSMENT_URL}
              className="mt-1 inline-block text-sm underline underline-offset-4"
            >
              Tell Varahion about the job
            </a>
          )}
        </div>
      )}

      <div className="mt-4 space-y-6">
        {stage === "chore" && (
          <ChoreForm initial={input} busy={busy} onSubmit={start} />
        )}

        {stage === "trying" && (
          <>
            <p className="text-center text-sm text-muted-foreground">
              The chore:{" "}
              <span className="font-medium text-foreground">{input.job}</span>
            </p>
            <WorkingView result={work} onRevealed={onRevealed} />
            {revealed && (
              <div className="flex justify-center">
                {work?.declined ? (
                  <button
                    ref={nextRef}
                    type="button"
                    onClick={restart}
                    className="rounded-full border-[1.5px] border-foreground px-6 py-3 font-medium"
                  >
                    Try a different chore
                  </button>
                ) : (
                  <button
                    ref={nextRef}
                    type="button"
                    onClick={() => {
                      setStatus("Vara is listening");
                      setStage("ask");
                    }}
                    className="rounded-full bg-foreground px-6 py-3 font-medium text-background"
                  >
                    Next: ask Vara anything
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {stage === "ask" && (
          <InterviewView
            turns={turns}
            busy={busy}
            onAsk={ask}
            onCard={() => getCard()}
          />
        )}

        {stage === "check" && card && (
          <CheckView
            card={card.data}
            previous={previous}
            busy={busy}
            fixesLeft={MAX_FIXES - fixesUsed}
            onConfirm={hatch}
            onFix={(text) => getCard(text)}
          />
        )}

        {stage === "hatched" && card && (
          <CardView
            card={card.data}
            shareToken={card.shareToken}
            onRestart={restart}
            focusRef={cardRef}
          />
        )}
      </div>
    </main>
  );
}
