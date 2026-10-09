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
