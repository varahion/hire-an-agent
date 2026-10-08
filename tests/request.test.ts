import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { readBody, requestGuard } from "../src/lib/request";

function req(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/work", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      ...headers,
    },
    body,
  });
}

test("requestGuard rejects a cross-origin request with 403", () => {
  const response = requestGuard(req("{}", { origin: "https://evil.example" }));
  assert.equal(response?.status, 403);
});

test("requestGuard rejects a non-JSON request with 415", () => {
  const response = requestGuard(req("{}", { "content-type": "text/plain" }));
  assert.equal(response?.status, 415);
});

test("requestGuard allows a same-origin JSON request", () => {
  assert.equal(requestGuard(req("{}")), null);
});

test("readBody throws on a body over 16 KB", async () => {
  await assert.rejects(
    readBody(req(JSON.stringify({ a: "x".repeat(16_385) }))),
  );
});

test("readBody throws on invalid JSON", async () => {
  await assert.rejects(readBody(req("{not json")));
});

test("readBody parses valid JSON", async () => {
  assert.deepEqual(await readBody(req('{"a":1}')), { a: 1 });
});

afterEach(() => {
  delete process.env.HIRE_ALLOWED_ORIGINS;
});

test("requestGuard allows the main site's origin when it proxies the tool", () => {
  process.env.HIRE_ALLOWED_ORIGINS =
    "https://varahion.com, https://www.varahion.com";
  assert.equal(
    requestGuard(req("{}", { origin: "https://varahion.com" })),
    null,
  );
  assert.equal(
    requestGuard(req("{}", { origin: "https://www.varahion.com" })),
    null,
  );
});

test("requestGuard still rejects origins that aren't listed", () => {
  process.env.HIRE_ALLOWED_ORIGINS = "https://varahion.com";
  assert.equal(
    requestGuard(req("{}", { origin: "https://varahion.com.evil.example" }))
      ?.status,
    403,
  );
});
