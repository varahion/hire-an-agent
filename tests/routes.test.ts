import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { POST as ask } from "../src/app/api/ask/route";
import { POST as card } from "../src/app/api/card/route";
import { POST as work } from "../src/app/api/work/route";
import { setEveClientForTests, type EveLike } from "../src/lib/eve";
import { memoryStore, setLimitStoreForTests } from "../src/lib/limits";
import { signSession } from "../src/lib/signing";
import { verifyCard } from "../src/lib/signing";

const workResult = { understood: ["Chocolate cake for 20"], missing: ["Price"], draft: "Hi Priya, yes we can…" };
const cardResult = {
  role: "Cake order assistant",
  does: ["Replies to orders", "Asks for missing details"],
  needs: ["Inbox"],
  humanDecides: ["Final prices"],
  hoursSavedPerWeek: 3,
  assumption: "Estimated from jo@example.com's order volume",
};

type Ev = { type: string; data: Record<string, unknown> };
function stream(events: Ev[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const e of events) yield e;
    },
  };
}

// A fake eve client: create() answers the work turn, attach().send() answers the rest.
function fakeClient(sendEvents: Ev[] = [{ type: "result.completed", data: { result: cardResult } }]): EveLike {
  return {
    sessions: {
      async create() {
        return {
          session: { state: { sessionId: "wrun_test", streamIndex: 2 } },
          response: stream([{ type: "result.completed", data: { result: workResult } }, { type: "session.waiting", data: {} }]),
        };
      },
      attach() {
        return { send: async () => stream(sendEvents) };
      },
    },
  } as unknown as EveLike;
}

function post(path: string, body: unknown, cookie?: string) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      "x-forwarded-for": "1.2.3.4",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function events(response: Response) {
  return (await response.text()).trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

const job = { job: "Replies to cake orders", example: "Hi, can I get a chocolate cake for 20 people on Saturday?" };
const sessionCookie = (asked = 0) =>
  `hire_session=${signSession({ sessionId: "wrun_test", asked, exp: Date.now() + 60_000 })}`;

beforeEach(() => {
  process.env.HIRE_SIGNING_SECRET = "route-test-secret";
  setLimitStoreForTests(memoryStore());
  setEveClientForTests(fakeClient());
});

test("work returns the structured result and sets a session cookie", async () => {
  const response = await work(post("/api/work", job));
  const list = await events(response);
  assert.deepEqual(list.at(-1), { type: "result", data: workResult });
  assert.match(response.headers.get("set-cookie") ?? "", /hire_session=.+HttpOnly/i);
});

test("work rejects invalid input with 400", async () => {
  const response = await work(post("/api/work", { job: "x", example: "short" }));
  assert.equal(response.status, 400);
});

test("work returns offline when the agent isn't configured", async () => {
  setEveClientForTests(null);
  const list = await events(await work(post("/api/work", job)));
  assert.equal(list.at(-1).type, "error");
  assert.equal(list.at(-1).code, "offline");
});

test("work enforces the per-visitor daily limit", async () => {
  for (let i = 0; i < 3; i++) await (await work(post("/api/work", job))).text();
  const list = await events(await work(post("/api/work", job)));
  assert.deepEqual(list.at(-1), { type: "limit", reason: "visitor" });
});

test("ask without a session cookie says the interview has ended", async () => {
  const list = await events(await ask(post("/api/ask", { question: "What do you need?" })));
  assert.equal(list.at(-1).code, "expired");
});

test("ask streams the answer and counts the question", async () => {
  setEveClientForTests(fakeClient([{ type: "message.appended", data: { messageDelta: "I'd need your inbox." } }]));
  const response = await ask(post("/api/ask", { question: "What do you need?" }, sessionCookie(0)));
  const list = await events(response);
  assert.deepEqual(list, [{ type: "delta", text: "I'd need your inbox." }]);
  assert.match(response.headers.get("set-cookie") ?? "", /hire_session=/);
});

test("a fourth question hits the question limit", async () => {
  const list = await events(await ask(post("/api/ask", { question: "One more?" }, sessionCookie(3))));
  assert.deepEqual(list.at(-1), { type: "limit", reason: "questions" });
});

test("card strips personal data and returns a valid share token", async () => {
  const list = await events(await card(post("/api/card", {}, sessionCookie(1))));
  const result = list.at(-1);
  assert.equal(result.type, "result");
  assert.equal(JSON.stringify(result.data).includes("jo@example.com"), false);
  assert.ok(verifyCard(result.shareToken));
});
