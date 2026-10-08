import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { loadCard } from "../src/lib/card";
import { signCard } from "../src/lib/signing";

const card = {
  role: "Cake order assistant",
  does: ["Replies to orders", "Asks for missing details"],
  needs: ["Inbox"],
  humanDecides: ["Final prices"],
  hoursSavedPerWeek: 3,
  assumption: "30 minutes a day",
};

beforeEach(() => {
  process.env.HIRE_SIGNING_SECRET = "card-page-secret";
});

test("loadCard returns the card for a valid token", () => {
  assert.deepEqual(loadCard(signCard(card)), card);
});

test("loadCard returns null for a tampered token", () => {
  const token = signCard(card);
  const [body, mac] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ card: { ...card, role: "Fake" }, issuedAt: 1 })).toString("base64url");
  assert.equal(loadCard(`${forged}.${mac}`), null);
  assert.equal(loadCard(body), null);
});

test("loadCard returns null for garbage and URL-encoded junk", () => {
  assert.equal(loadCard("not-a-token"), null);
  assert.equal(loadCard("%E0%A4%A"), null);
});
