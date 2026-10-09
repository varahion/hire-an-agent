import type { JobInput } from "./schemas";

/** The first turn's message. The agent treats this JSON as data, not instructions. */
export function workMessage(input: JobInput): string {
  return JSON.stringify({ job: input.job, example: input.example });
}

/** The card turn's message, answered with a CardResult. */
export const CARD_MESSAGE = "Write your CV card.";

/** The card message; with the owner's correction, a revision request carrying it as data. */
export function cardMessage(correction?: string): string {
  if (!correction) return CARD_MESSAGE;
  return JSON.stringify({
    request: "Revise your CV card with this change from the owner.",
    correction,
  });
}
