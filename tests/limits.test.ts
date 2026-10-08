import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { memoryStore, rateLimit, visitorKey } from "../src/lib/limits";

const day = new Date("2026-10-08T12:00:00Z");
const nextDay = new Date("2026-10-09T12:00:00Z");

afterEach(() => {
  delete process.env.HIRE_DAILY_SESSION_CAP;
});

test("a visitor gets three sessions a day, then is limited", async () => {
  const store = memoryStore();
  for (let i = 0; i < 3; i++) assert.deepEqual(await rateLimit(store, "v1", day), { ok: true });
  assert.deepEqual(await rateLimit(store, "v1", day), { ok: false, reason: "visitor" });
});

test("the global daily cap applies across visitors", async () => {
  process.env.HIRE_DAILY_SESSION_CAP = "2";
  const store = memoryStore();
  assert.deepEqual(await rateLimit(store, "v1", day), { ok: true });
  assert.deepEqual(await rateLimit(store, "v2", day), { ok: true });
  assert.deepEqual(await rateLimit(store, "v3", day), { ok: false, reason: "global" });
});

test("limits reset on a new UTC day", async () => {
  const store = memoryStore();
  for (let i = 0; i < 3; i++) await rateLimit(store, "v1", day);
  assert.deepEqual(await rateLimit(store, "v1", nextDay), { ok: true });
});

test("visitorKey is a stable hash that hides the IP", () => {
  const make = (ip: string) =>
    new Request("http://localhost/", { headers: { "x-forwarded-for": ip, "user-agent": "UA" } });
  const a = visitorKey(make("1.2.3.4"));
  assert.equal(a, visitorKey(make("1.2.3.4")));
  assert.notEqual(a, visitorKey(make("5.6.7.8")));
  assert.equal(a.includes("1.2.3.4"), false);
  assert.match(a, /^[0-9a-f]{64}$/);
});
