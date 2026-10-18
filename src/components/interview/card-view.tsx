"use client";

import { useState } from "react";
import { withBase } from "@/lib/paths";
import type { CardResult } from "@/lib/schemas";
import { CvCard } from "../cv-card";
import { HireButton } from "../hire-button";

export function CardView({
  card,
  shareToken,
  onRestart,
  focusRef,
}: {
  card: CardResult;
  shareToken: string;
  onRestart: () => void;
  focusRef?: React.Ref<HTMLDivElement>;
}) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const path = withBase(`/c/${shareToken}`);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", `${window.location.origin}${path}`);
    }
  };

  const download = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${path}/opengraph-image`);
      if (!response.ok) throw new Error("image");
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "vara-card.png";
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      window.open(`${path}/opengraph-image`, "_blank", "noopener");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div ref={focusRef} tabIndex={-1} className="outline-none">
        <CvCard card={card} id={shareToken} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <HireButton role={card.role} />
        <button
          type="button"
          onClick={copy}
          className="rounded-full border-[1.5px] border-foreground px-5 py-3 font-medium"
        >
          {copied ? "Link copied" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={download}
          disabled={saving}
          className="rounded-full border-[1.5px] border-foreground px-5 py-3 font-medium disabled:opacity-40"
        >
          {saving ? "Saving…" : "Download image"}
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Link copied to the clipboard." : ""}
      </p>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full border-[1.5px] border-foreground px-6 py-3 font-medium"
        >
          Teach Vara another chore
        </button>
      </div>
    </section>
  );
}
