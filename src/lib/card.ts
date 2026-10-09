import { CARD_ID, loadCardById } from "./cards";
import type { CardResult, VaraLook } from "./schemas";
import { verifyCard } from "./signing";

/**
 * The card behind a share link, or null when the link is invalid.
 * New links use a short stored id; older links carry a signed token.
 */
export async function loadCard(token: string): Promise<CardResult | null> {
  let decoded = token;
  try {
    decoded = decodeURIComponent(token);
  } catch {
    return null;
  }
  try {
    if (CARD_ID.test(decoded)) return await loadCardById(decoded);
    return verifyCard(decoded)?.card ?? null;
  } catch {
    return null;
  }
}

/** Cards saved before Vara have no name or look: show a plain Vara. */
export function withCardDefaults(
  card: CardResult,
): CardResult & { name: string; look: VaraLook } {
  return { ...card, name: card.name ?? "Vara", look: card.look ?? "other" };
}
