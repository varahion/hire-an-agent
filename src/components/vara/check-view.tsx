"use client";

import { useId, useState } from "react";
import type { CardResult } from "@/lib/schemas";

type Props = {
  card: CardResult;
  /** The read-back before the last fix; items not in it are marked new. */
  previous?: CardResult;
  busy: boolean;
  fixesLeft: number;
  onConfirm: () => void;
  onFix: (text: string) => void;
};

function Items({ items, before }: { items: string[]; before?: string[] }) {
  return (
    <ul className="mb-2.5 list-disc space-y-1 pl-5">
      {items.map((item) => {
        const isNew = before && !before.includes(item);
        return (
          <li key={item} className={isNew ? "font-medium text-accent-ink" : undefined}>
            {item}
            {isNew && " (new)"}
          </li>
        );
      })}
    </ul>
  );
}

/** Screen 4: Vara reads back what it learned; the owner confirms or sends it back with a fix. */
export function CheckView({ card, previous, busy, fixesLeft, onConfirm, onFix }: Props) {
  const [fixing, setFixing] = useState(false);
  const [text, setText] = useState("");
  const fixId = useId();

  return (
    <section className="mx-auto grid max-w-[520px] gap-3.5">
      <div
        className={`rounded-xl border border-border bg-card px-4 py-3.5 transition-opacity ${busy ? "opacity-40" : ""}`}
      >
        <h2 className="mb-2 font-display text-lg font-bold">
          Here&apos;s the job as I understand it
        </h2>
        <p className="text-[13px] text-muted-foreground">I&apos;d do</p>
        <Items items={card.does} before={previous?.does} />
        <p className="text-[13px] text-muted-foreground">I&apos;d need</p>
        <Items items={card.needs} before={previous?.needs} />
        <p className="text-[13px] text-muted-foreground">Stays with you</p>
        <Items items={card.humanDecides} before={previous?.humanDecides} />
      </div>

      {fixing ? (
        <form
          className="grid gap-3.5"
          onSubmit={(event) => {
            event.preventDefault();
            if (busy || text.trim().length < 3) return;
            onFix(text.trim());
            setText("");
            setFixing(false);
          }}
        >
          <div className="vara-note">
            <label htmlFor={fixId} className="font-display font-medium">
              What should Vara change?
            </label>
            <textarea
              id={fixId}
              value={text}
              maxLength={200}
              rows={3}
              autoFocus
              onChange={(e) => setText(e.target.value)}
              placeholder="Never offer a discount without asking me"
              className="mt-1 resize-y leading-relaxed"
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={busy || text.trim().length < 3}
              className="rounded-full bg-foreground px-6 py-3 font-medium text-background disabled:opacity-40"
            >
              Send Vara back to fix it
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap justify-center gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-full bg-foreground px-6 py-3 font-medium text-background disabled:opacity-40"
          >
            Yes, hatch my Vara
          </button>
          {fixesLeft > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setFixing(true)}
              className="rounded-full border-[1.5px] border-foreground px-6 py-3 font-medium disabled:opacity-40"
            >
              Change something
            </button>
          )}
        </div>
      )}
    </section>
  );
}
