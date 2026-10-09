import assert from "node:assert/strict";
import test from "node:test";
import { stripPii, stripPiiFromCard } from "../src/lib/pii";

test("stripPii removes email addresses and phone numbers", () => {
  const out = stripPii("mail jo@example.com or 07700 900123");
  assert.equal(out.includes("@"), false);
  assert.equal(/\d{11}/.test(out.replace(/\s/g, "")), false);
  assert.match(out, /\[removed\]/);
});

test("stripPii removes international phone numbers", () => {
  assert.equal(stripPii("call +44 7700 900123 today").includes("7700"), false);
});

test("stripPii leaves prices and quantities alone", () => {
  assert.equal(stripPii("£45 for 20 people"), "£45 for 20 people");
});

test("stripPiiFromCard cleans every text field", () => {
  const card = stripPiiFromCard({
    role: "Assistant for jo@example.com",
    does: ["Calls 07700 900123"],
    needs: ["Inbox"],
    humanDecides: ["Prices"],
    hoursSavedPerWeek: 2,
    assumption: "Based on jo@example.com's note",
  });
  assert.equal(JSON.stringify(card).includes("jo@example.com"), false);
  assert.equal(JSON.stringify(card).includes("900123"), false);
  assert.equal(card.hoursSavedPerWeek, 2);
});

test("stripPii removes links and bare domains", () => {
  const out = stripPii(
    "Refunds at https://scam.example/pay or www.scam.example or scam.example/refund",
  );
  assert.equal(out.includes("scam.example"), false);
});

test("stripPii leaves times and dates alone", () => {
  assert.equal(stripPii("Pickup 2026-10-08 10:30"), "Pickup 2026-10-08 10:30");
});

test("stripPiiFromCard strips an email from the name and keeps the look", () => {
  const card = stripPiiFromCard({
    role: "Assistant",
    does: ["Replies"],
    needs: ["Inbox"],
    humanDecides: ["Prices"],
    hoursSavedPerWeek: 2,
    assumption: "A guess",
    name: "jo@example.com Vara",
    look: "inbox",
  });
  assert.equal(JSON.stringify(card).includes("jo@example.com"), false);
  assert.equal(card.look, "inbox");
});

test("stripPiiFromCard drops a name that was only personal data", () => {
  const card = stripPiiFromCard({
    role: "Assistant",
    does: ["Replies"],
    needs: ["Inbox"],
    humanDecides: ["Prices"],
    hoursSavedPerWeek: 2,
    assumption: "A guess",
    name: "jo@example.com",
  });
  assert.equal("name" in card, false);
});
