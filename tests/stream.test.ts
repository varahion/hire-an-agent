import assert from "node:assert/strict";
import test from "node:test";
import { ndjsonResponse, toAppEvents, type AppEvent } from "../src/lib/stream";

// Minimal eve stream events; only the fields the mapper reads.
const ev = (type: string, data: Record<string, unknown> = {}) =>
  ({ type, data }) as never;

test("message.appended becomes a delta", () => {
  assert.deepEqual(
    toAppEvents(ev("message.appended", { messageDelta: "Hi" })),
    [{ type: "delta", text: "Hi" }],
  );
});

test("result.completed becomes a result", () => {
  const result = { understood: [], missing: [], draft: "x" };
  assert.deepEqual(toAppEvents(ev("result.completed", { result })), [
    { type: "result", data: result },
  ]);
});

test("session.failed becomes a failed error", () => {
  const [event] = toAppEvents(ev("session.failed", { error: "boom" }));
  assert.equal(event.type, "error");
  assert.equal(event.type === "error" && event.code, "failed");
});

test("a session-limit pause becomes a session limit", () => {
  assert.deepEqual(
    toAppEvents(
      ev("input.requested", { requests: [{ kind: "session-limit" }] }),
    ),
    [{ type: "limit", reason: "session" }],
  );
});

test("runTurn stops at a session-limit pause and reports it", async () => {
  const { runTurn } = await import("../src/lib/turn");
  const reasons: string[] = [];
  async function* events() {
    yield ev("input.requested", { requests: [{ kind: "session-limit" }] });
    yield ev("turn.waiting", { on: "input" });
    yield ev("message.appended", { messageDelta: "should never be read" });
  }
  const out: AppEvent[] = [];
  for await (const e of runTurn(events(), {
    deltas: true,
    onFailure: (r) => reasons.push(r),
  }))
    out.push(e);
  assert.deepEqual(out, [{ type: "limit", reason: "session" }]);
  assert.deepEqual(reasons, ["session-limit"]);
});

test("unknown event types are ignored", () => {
  assert.deepEqual(
    toAppEvents(ev("reasoning.appended", { reasoningDelta: "hmm" })),
    [],
  );
});

test("runTurn trims an oversized structured result instead of failing", async () => {
  const { runTurn } = await import("../src/lib/turn");
  const { cardResultSchema } = await import("../src/lib/schemas");
  const { coerceCard } = await import("../src/lib/coerce");
  const oversized = {
    role: "Assistant",
    does: ["a", "b"],
    needs: ["Inbox"],
    humanDecides: ["Prices"],
    hoursSavedPerWeek: 2,
    assumption: "z".repeat(200),
  };
  async function* events() {
    yield ev("result.completed", { result: oversized });
    yield ev("session.waiting");
  }
  const out: AppEvent[] = [];
  for await (const e of runTurn(events(), {
    deltas: false,
    schema: cardResultSchema,
    coerce: coerceCard,
  }))
    out.push(e);
  assert.equal(out.length, 1);
  assert.equal(out[0].type, "result");
});

test("ndjsonResponse writes one JSON object per line", async () => {
  async function* events(): AsyncIterable<AppEvent> {
    yield { type: "status", text: "Reading" };
    yield { type: "delta", text: "Hello" };
  }
  const response = ndjsonResponse(events());
  assert.equal(response.headers.get("content-type"), "application/x-ndjson");
  const lines = (await response.text())
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l));
  assert.deepEqual(lines, [
    { type: "status", text: "Reading" },
    { type: "delta", text: "Hello" },
  ]);
});
