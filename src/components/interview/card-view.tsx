"use client";

import type { CardResult } from "@/lib/schemas";
import { CvCard } from "../cv-card";

export function CardView({ card, onRestart }: { card: CardResult; shareToken: string; onRestart: () => void }) {
  return (
    <section className="space-y-6">
      <CvCard card={card} />
      <button type="button" onClick={onRestart} className="text-sm underline underline-offset-4">
        Interview a candidate for another job
      </button>
    </section>
  );
}
