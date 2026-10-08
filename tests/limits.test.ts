import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import {
  clientIp,
  getLimitStore,
  memoryStore,
  rateLimit,
  setLimitStoreForTests,
  visitorKey,
} from "../src/lib/limits";

const day = new Date("2026-10-08T12:00:00Z");
const nextDay = new Date("2026-10-09T12:00:00Z");

afterEach(() => {
  delete process.env.HIRE_DAILY_SESSION_CAP;
});

test("a visitor gets three sessions a day, then is limited", async () => {
  const store = memoryStore();
  for (let i = 0; i < 3; i++)
    assert.deepEqual(
      await rateLimit(store, { visitor: "v1", ip: "ip1" }, day),
      { ok: true },
    );
  assert.deepEqual(await rateLimit(store, { visitor: "v1", ip: "ip1" }, day), {
    ok: false,
    reason: "visitor",
  });
});

test("the global daily cap applies across visitors", async () => {
  process.env.HIRE_DAILY_SESSION_CAP = "2";
  const store = memoryStore();
  assert.deepEqual(await rateLimit(store, { visitor: "v1", ip: "ip1" }, day), {
    ok: true,
  });
  assert.deepEqual(await rateLimit(store, { visitor: "v2", ip: "ip2" }, day), {
    ok: true,
  });
  assert.deepEqual(await rateLimit(store, { visitor: "v3", ip: "ip3" }, day), {
    ok: false,
    reason: "global",
  });
});

test("limits reset on a new UTC day", async () => {
  const store = memoryStore();
  for (let i = 0; i < 3; i++)
    await rateLimit(store, { visitor: "v1", ip: "ip1" }, day);
  assert.deepEqual(
    await rateLimit(store, { visitor: "v1", ip: "ip1" }, nextDay),
    { ok: true },
  );
});

test("visitorKey is a stable hash that hides the IP", () => {
  const make = (ip: string) =>
    new Request("http://localhost/", {
      headers: { "x-forwarded-for": ip, "user-agent": "UA" },
    });
  const a = visitorKey(make("1.2.3.4"));
  assert.equal(a, visitorKey(make("1.2.3.4")));
  assert.notEqual(a, visitorKey(make("5.6.7.8")));
  assert.equal(a.includes("1.2.3.4"), false);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test("changing the user agent doesn't get past the per-IP limit", async () => {
  const store = memoryStore();
  for (let i = 0; i < 5; i++)
    assert.deepEqual(
      await rateLimit(store, { visitor: `ua${i}`, ip: "same-ip" }, day),
      { ok: true },
    );
  assert.deepEqual(
    await rateLimit(store, { visitor: "ua9", ip: "same-ip" }, day),
    { ok: false, reason: "visitor" },
  );
});

test("clientIp prefers x-real-ip over x-forwarded-for", () => {
  const request = new Request("http://localhost/", {
    headers: { "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" },
  });
  assert.equal(clientIp(request), "9.9.9.9");
});

test("in production without Upstash there is no limit store (fail closed)", () => {
  setLimitStoreForTests(undefined);
  const env = { ...process.env };
  process.env.VERCEL_ENV = "production";
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  try {
    assert.equal(getLimitStore(), null);
  } finally {
    process.env = env;
  }
});

test("Vercel's KV_ variable names count as an Upstash configuration", () => {
  setLimitStoreForTests(undefined);
  const env = { ...process.env };
  process.env.VERCEL_ENV = "production";
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.KV_REST_API_URL = "https://example.upstash.io";
  process.env.KV_REST_API_TOKEN = "test-token";
  try {
    assert.notEqual(getLimitStore(), null);
  } finally {
    process.env = env;
  }
});
