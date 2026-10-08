"use client";

import { useState } from "react";
import type { CardResult } from "@/lib/schemas";
import { CvCard } from "../cv-card";
import { HireButton } from "../hire-button";

export function CardView({ card, shareToken, onRestart }: { card: CardResult; shareToken: string; onRestart: () => void }) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const path = `/c/${shareToken}`;

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
      const blob = await (await fetch(`${path}/opengraph-image`)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hire-an-agent-card.png";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <CvCard card={card} />
      <div className="flex flex-wrap items-center gap-3">
        <HireButton role={card.role} />
        <button type="button" onClick={copy} className="border border-foreground px-4 py-3 text-sm font-medium">
          {copied ? "Link copied" : "Copy link"}
        </button>
        <button type="button" onClick={download} disabled={saving} className="border border-foreground px-4 py-3 text-sm font-medium disabled:opacity-40">
          {saving ? "Saving…" : "Download image"}
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Link copied to the clipboard." : ""}
      </p>
      <button type="button" onClick={onRestart} className="text-sm underline underline-offset-4">
        Interview a candidate for another job
      </button>
    </section>
  );
}
