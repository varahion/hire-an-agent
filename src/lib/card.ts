import type { CardResult } from "./schemas";
import { verifyCard } from "./signing";

/** The card behind a share link, or null when the link is invalid or tampered with. */
export function loadCard(token: string): CardResult | null {
  let decoded = token;
  try {
    decoded = decodeURIComponent(token);
  } catch {
    return null;
  }
  try {
    return verifyCard(decoded)?.card ?? null;
  } catch {
    return null;
  }
}
