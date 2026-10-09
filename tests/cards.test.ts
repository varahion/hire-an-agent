import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { loadCard, withCardDefaults } from "../src/lib/card";
import {
  memoryCardStore,
  saveCard,
  setCardStoreForTests,
} from "../src/lib/cards";
import { signCard } from "../src/lib/signing";

const card = {
  role: "Parking registration assistant",
  does: ["Registers the car each morning", "Saves the confirmation"],
  needs: ["Parking website"],
  humanDecides: ["What to do if registration fails"],
  hoursSavedPerWeek: 1,
  assumption: "About 8 minutes a morning",
};

beforeEach(() => {
  process.env.HIRE_SIGNING_SECRET = "cards-secret";
  setCardStoreForTests(memoryCardStore());
});

test("saveCard returns a short URL-safe id", async () => {
  const id = await saveCard(card);
  assert.match(id, /^[A-Za-z0-9_-]{8}$/);
});

test("a saved card loads by its short id", async () => {
  assert.deepEqual(await loadCard(await saveCard(card)), card);
});

test("an unknown short id loads nothing", async () => {
  assert.equal(await loadCard("zzzzzzzz"), null);
});

test("old signed links still load", async () => {
  assert.deepEqual(await loadCard(signCard(card)), card);
});

test("two saves get different ids", async () => {
  assert.notEqual(await saveCard(card), await saveCard(card));
});

test("withCardDefaults fills name and look for an old card", () => {
  const filled = withCardDefaults(card);
  assert.equal(filled.name, "Vara");
  assert.equal(filled.look, "other");
});
