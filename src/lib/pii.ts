import type { CardResult } from "./schemas";

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
// Phone-like runs: optional +, then 9+ digits allowing spaces, dots, dashes and brackets.
const PHONE = /\+?\(?\d[\d\s().-]{7,}\d/g;
const ISO_DATE = /\d{4}-\d{2}-\d{2}/;
// Links and bare domains: a card is public, so it must not carry anyone's URL.
const URL_LIKE =
  /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|co|uk|example|app|dev|ai|info|biz|shop|xyz|me)\b(?:\/\S*)?/gi;

/** Backstop: replace email addresses, links and phone numbers with "[removed]". */
export function stripPii(text: string): string {
  return text
    .replace(EMAIL, "[removed]")
    .replace(URL_LIKE, "[removed]")
    .replace(PHONE, (match) => {
      if (ISO_DATE.test(match)) return match;
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
