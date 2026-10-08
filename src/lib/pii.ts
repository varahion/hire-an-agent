import type { CardResult } from "./schemas";

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
// Phone-like runs: optional +, then 9+ digits allowing spaces, dots, dashes and brackets.
const PHONE = /\+?\(?\d[\d\s().-]{7,}\d/g;

/** Backstop: replace email addresses and phone numbers with "[removed]". */
export function stripPii(text: string): string {
  return text.replace(EMAIL, "[removed]").replace(PHONE, (match) => {
    const digits = match.replace(/\D/g, "");
    return digits.length >= 9 ? "[removed]" : match;
  });
}

export function stripPiiFromCard(card: CardResult): CardResult {
  return {
    role: stripPii(card.role),
    does: card.does.map(stripPii),
    needs: card.needs.map(stripPii),
    humanDecides: card.humanDecides.map(stripPii),
    hoursSavedPerWeek: card.hoursSavedPerWeek,
    assumption: stripPii(card.assumption),
  };
}
