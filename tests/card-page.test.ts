import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { loadCard } from "../src/lib/card";
import { cardMeta } from "../src/lib/card-display";
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

test("loadCard returns the card for a valid token", async () => {
  assert.deepEqual(await loadCard(signCard(card)), card);
});

test("loadCard returns null for a tampered token", async () => {
  const token = signCard(card);
  const [body, mac] = token.split(".");
  const forged = Buffer.from(
    JSON.stringify({ card: { ...card, role: "Fake" }, issuedAt: 1 }),
  ).toString("base64url");
  assert.equal(await loadCard(`${forged}.${mac}`), null);
  assert.equal(await loadCard(body), null);
});

test("loadCard returns null for garbage and URL-encoded junk", async () => {
  assert.equal(await loadCard("not-a-token"), null);
  assert.equal(await loadCard("%E0%A4%A"), null);
});

test("metadata uses the Vara name", () => {
  const meta = cardMeta({ ...card, name: "Cake Vara", look: "orders" });
  assert.equal(meta.title, "Cake Vara · Vara by Varahion");
  assert.equal(meta.ogTitle, "Cake Vara: Cake order assistant");
});

test("an old card gets the fallback name", () => {
  assert.equal(cardMeta(card).title, "Vara · Vara by Varahion");
});
