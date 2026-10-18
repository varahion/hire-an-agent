import assert from "node:assert/strict";
import test from "node:test";
import {
  cardResultSchema,
  correctionSchema,
  jobInputSchema,
  workResultSchema,
} from "../src/lib/schemas";

const card = {
  role: "Cake order assistant",
  does: ["Replies to orders", "Asks for missing details"],
  needs: ["Inbox", "Price list"],
  humanDecides: ["Final prices"],
  hoursSavedPerWeek: 3,
  assumption: "30 minutes a day, six days a week",
};

test("jobInputSchema rejects a job longer than 200 characters", () => {
  const result = jobInputSchema.safeParse({
    job: "a".repeat(201),
    example: "x".repeat(40),
  });
  assert.equal(result.success, false);
});

test("jobInputSchema rejects an example longer than 3,000 characters", () => {
  const result = jobInputSchema.safeParse({
    job: "Replies to orders",
    example: "x".repeat(3001),
  });
  assert.equal(result.success, false);
});

test("jobInputSchema rejects an example shorter than 20 characters", () => {
  const result = jobInputSchema.safeParse({
    job: "Replies to orders",
    example: "x".repeat(19),
  });
  assert.equal(result.success, false);
});

test("jobInputSchema trims whitespace", () => {
  const result = jobInputSchema.parse({
    job: "  Replies to orders  ",
    example: `  ${"x".repeat(30)}  `,
  });
  assert.equal(result.job, "Replies to orders");
  assert.equal(result.example, "x".repeat(30));
});

test("cardResultSchema rejects hoursSavedPerWeek below 0.5 and above 40", () => {
  assert.equal(
    cardResultSchema.safeParse({ ...card, hoursSavedPerWeek: 0.4 }).success,
    false,
  );
  assert.equal(
    cardResultSchema.safeParse({ ...card, hoursSavedPerWeek: 41 }).success,
    false,
  );
  assert.equal(cardResultSchema.safeParse(card).success, true);
});

test("cardResultSchema rejects more than four 'does' items", () => {
  const result = cardResultSchema.safeParse({
    ...card,
    does: ["a", "b", "c", "d", "e"],
  });
  assert.equal(result.success, false);
});

test("workResultSchema accepts a declined result with an empty draft", () => {
  const result = workResultSchema.safeParse({
    understood: [],
    missing: [],
    draft: "",
    declined: {
      reason: "Fake reviews deceive people.",
      suggestion: "Reply to real reviews instead.",
    },
  });
  assert.equal(result.success, true);
});

test("a card with name and look parses", () => {
  const result = cardResultSchema.safeParse({ ...card, name: "Cake Vara", look: "orders" });
  assert.equal(result.success, true);
});

test("a card without name and look still parses", () => {
  assert.equal(cardResultSchema.safeParse(card).success, true);
});

test("a look outside the list is rejected", () => {
  assert.equal(cardResultSchema.safeParse({ ...card, look: "wizard" }).success, false);
});

test("a name over 24 characters is rejected", () => {
  assert.equal(cardResultSchema.safeParse({ ...card, name: "a".repeat(25) }).success, false);
});

test("correctionSchema accepts no correction", () => {
  assert.deepEqual(correctionSchema.parse({}), {});
});

test("correctionSchema rejects 2 and 201 characters", () => {
  assert.equal(correctionSchema.safeParse({ correction: "ab" }).success, false);
  assert.equal(correctionSchema.safeParse({ correction: "a".repeat(201) }).success, false);
});
