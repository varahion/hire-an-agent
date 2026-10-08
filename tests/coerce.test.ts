import assert from "node:assert/strict";
import test from "node:test";
import { coerceCard, coerceWork } from "../src/lib/coerce";
import { cardResultSchema, workResultSchema } from "../src/lib/schemas";

const card = {
  role: "Cake order assistant",
  does: ["Replies to orders", "Asks for missing details"],
  needs: ["Inbox"],
  humanDecides: ["Final prices"],
  hoursSavedPerWeek: 3,
  assumption: "30 minutes a day",
};

test("coerceCard trims an over-long assumption to fit the schema", () => {
  const out = coerceCard({ ...card, assumption: "x".repeat(300) });
  assert.ok(out);
  assert.equal(cardResultSchema.safeParse(out).success, true);
  assert.equal(out.assumption.length <= 140, true);
  assert.ok(out.assumption.endsWith("…"));
});

test("coerceCard keeps only the first four 'does' items and clamps hours", () => {
  const out = coerceCard({ ...card, does: ["a", "b", "c", "d", "e", "f"], hoursSavedPerWeek: 80 });
  assert.deepEqual(out?.does, ["a", "b", "c", "d"]);
  assert.equal(out?.hoursSavedPerWeek, 40);
});

test("coerceCard returns null when required content is missing", () => {
  assert.equal(coerceCard({ ...card, role: "" }), null);
  assert.equal(coerceCard({ ...card, does: ["only one"] }), null);
  assert.equal(coerceCard("not an object"), null);
});

test("coerceWork trims an over-long draft and extra list items", () => {
  const out = coerceWork({
    understood: ["a", "b", "c", "d", "e"],
    missing: [],
    draft: "y".repeat(2000),
  });
  assert.ok(out);
  assert.equal(workResultSchema.safeParse(out).success, true);
  assert.equal(out.understood.length, 4);
  assert.equal(out.draft.length <= 1500, true);
});

test("coerceWork passes a valid result through unchanged", () => {
  const valid = { understood: ["a"], missing: ["b"], draft: "Hello" };
  assert.deepEqual(coerceWork(valid), valid);
});
