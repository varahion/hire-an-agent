import assert from "node:assert/strict";
import test from "node:test";
import { BASE_PATH, withBase } from "../src/lib/paths";

test("the tool lives under /tools/hire-an-agent", () => {
  assert.equal(BASE_PATH, "/tools/hire-an-agent");
});

test("withBase prefixes app paths", () => {
  assert.equal(withBase("/api/work"), "/tools/hire-an-agent/api/work");
  assert.equal(withBase("/c/abc"), "/tools/hire-an-agent/c/abc");
});
