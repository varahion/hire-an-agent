import type { CardResult, VaraLook } from "./schemas";

// Client-safe helpers for showing a card (no server imports).

/** Cards saved before Vara have no name or look: show a plain Vara. */
export function withCardDefaults(
  card: CardResult,
): CardResult & { name: string; look: VaraLook } {
  return { ...card, name: card.name ?? "Vara", look: card.look ?? "other" };
}

/** A cosmetic collector number for a card, stable for its share id. */
export function cardNumber(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 9000;
  return String(1000 + hash);
}

/** Page and share titles for a card's public page. */
export function cardMeta(card: CardResult): {
  title: string;
  ogTitle: string;
  description: string;
} {
  const vara = withCardDefaults(card);
  return {
    title: `${vara.name} · Vara by Varahion`,
    ogTitle: `${vara.name}: ${vara.role}`,
    description: `${vara.does[0]} Saves about ${vara.hoursSavedPerWeek} hours a week.`,
  };
}
