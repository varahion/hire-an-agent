import type { JobInput } from "./schemas";

/** The first turn's message. The agent treats this JSON as data, not instructions. */
export function workMessage(input: JobInput): string {
  return JSON.stringify({ job: input.job, example: input.example });
}

/** The final turn's message, answered with a CardResult. */
export const CARD_MESSAGE = "Write your CV card.";
