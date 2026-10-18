import { z } from "zod";

export const jobInputSchema = z.object({
  job: z.string().trim().min(3).max(200),
  example: z.string().trim().min(20).max(3000),
});

export const workResultSchema = z.object({
  understood: z.array(z.string().max(200)).max(4),
  missing: z.array(z.string().max(200)).max(4),
  draft: z.string().max(1500),
  declined: z
    .object({ reason: z.string().max(300), suggestion: z.string().max(300) })
    .optional(),
});

/** Which accessory a hatched Vara wears; picked by the agent from the job. */
export const VARA_LOOKS = [
  "orders",
  "quotes",
  "bookings",
  "payments",
  "inbox",
  "admin",
  "other",
] as const;
export type VaraLook = (typeof VARA_LOOKS)[number];

// name and look are optional so cards stored before Vara still load.
export const cardResultSchema = z.object({
  role: z.string().min(1).max(60),
  does: z.array(z.string().max(120)).min(2).max(4),
  needs: z.array(z.string().max(120)).min(1).max(4),
  humanDecides: z.array(z.string().max(120)).min(1).max(3),
  hoursSavedPerWeek: z.number().min(0.5).max(40),
  assumption: z.string().max(140),
  name: z
    .string()
    .min(1)
    .max(24)
    .optional()
    .describe('A friendly name ending in "Vara", e.g. "Cake Vara".'),
  look: z
    .enum(VARA_LOOKS)
    .optional()
    .describe(
      "What the work is about, not where it arrives. orders: customer orders (cakes, products), even by email. quotes: pricing jobs or call-outs. bookings: appointments. payments: invoices. inbox: other email. admin: forms, records, logins. other: anything else.",
    ),
});

/** The owner's change to the card, from the double-check step. */
export const correctionSchema = z.object({
  correction: z.string().trim().min(3).max(200).optional(),
});

export const questionSchema = z.object({
  question: z.string().trim().min(3).max(300),
});

export type JobInput = z.infer<typeof jobInputSchema>;
export type WorkResult = z.infer<typeof workResultSchema>;
export type CardResult = z.infer<typeof cardResultSchema>;
