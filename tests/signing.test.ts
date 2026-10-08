import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import {
  signCard,
  signSession,
  verifyCard,
  verifySession,
} from "../src/lib/signing";

const card = {
  role: "Cake order assistant",
  does: ["Replies to orders", "Asks for missing details"],
  needs: ["Inbox"],
  humanDecides: ["Final prices"],
  hoursSavedPerWeek: 3,
  assumption: "30 minutes a day",
};

beforeEach(() => {
  process.env.HIRE_SIGNING_SECRET = "test-secret-one";
});

// Flip a character in the middle of the signature. The last base64url character
// can carry unused padding bits, so changing it doesn't always change the bytes.
function flipSignatureChar(token: string) {
  const [body, mac] = token.split(".");
  const i = Math.floor(mac.length / 2);
  const swapped = mac[i] === "A" ? "B" : "A";
  return `${body}.${mac.slice(0, i)}${swapped}${mac.slice(i + 1)}`;
}

test("session tokens round-trip", () => {
  const claims = { sessionId: "s_1", asked: 1, exp: Date.now() + 60_000 };
  assert.deepEqual(verifySession(signSession(claims)), claims);
});

test("a tampered session payload is rejected", () => {
  const token = signSession({
    sessionId: "s_1",
    asked: 0,
    exp: Date.now() + 60_000,
  });
  const [, signature] = token.split(".");
  const forged = Buffer.from(
    JSON.stringify({ sessionId: "s_2", asked: 0, exp: Date.now() + 60_000 }),
  ).toString("base64url");
  assert.equal(verifySession(`${forged}.${signature}`), null);
});

test("an expired session is rejected", () => {
  const token = signSession({ sessionId: "s_1", asked: 0, exp: 1_000 });
  assert.equal(verifySession(token, 2_000), null);
});

test("a session signed with another secret is rejected", () => {
  const token = signSession({
    sessionId: "s_1",
    asked: 0,
    exp: Date.now() + 60_000,
  });
  process.env.HIRE_SIGNING_SECRET = "test-secret-two";
  assert.equal(verifySession(token), null);
});

test("signing throws when the secret is missing", () => {
  delete process.env.HIRE_SIGNING_SECRET;
  assert.throws(() => signSession({ sessionId: "s_1", asked: 0, exp: 1 }));
});

test("card tokens round-trip", () => {
  const verified = verifyCard(signCard(card, 123));
  assert.deepEqual(verified, { card, issuedAt: 123 });
});

test("a card token with one changed signature character is rejected", () => {
  for (let issuedAt = 0; issuedAt < 50; issuedAt++)
    assert.equal(verifyCard(flipSignatureChar(signCard(card, issuedAt))), null);
});

test("a signed payload that fails the card schema is rejected", () => {
  const token = signCard({ ...card, hoursSavedPerWeek: 99 });
  assert.equal(verifyCard(token), null);
});
