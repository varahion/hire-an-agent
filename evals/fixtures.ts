import { workMessage } from "../src/lib/prompts";

export const bakeryJob = "Replies to cake orders that arrive by email every morning";

export const bakeryExample =
  "Hi! Could I order a chocolate cake for about 20 people this Saturday? It's for my daughter's birthday. Thanks, Priya";

export const bakeryWork = workMessage({ job: bakeryJob, example: bakeryExample });
