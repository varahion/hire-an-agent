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
