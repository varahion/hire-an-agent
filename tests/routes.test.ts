import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { POST as ask } from "../src/app/api/ask/route";
import { POST as card } from "../src/app/api/card/route";
import { POST as work } from "../src/app/api/work/route";
import { setEveClientForTests, type EveLike } from "../src/lib/eve";
import { memoryStore, setLimitStoreForTests } from "../src/lib/limits";
import { memoryCardStore, setCardStoreForTests } from "../src/lib/cards";
import { loadCard } from "../src/lib/card";
import { signSession } from "../src/lib/signing";

const workResult = {
  understood: ["Chocolate cake for 20"],
  missing: ["Price"],
  draft: "Hi Priya, yes we can…",
};
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

// Messages the fake client was sent, newest last.
const sent: string[] = [];

// A fake eve client: create() answers the work turn, attach().send() answers the rest.
function fakeClient(
  sendEvents: Ev[] = [
    { type: "result.completed", data: { result: cardResult } },
  ],
): EveLike {
  return {
    sessions: {
      async create() {
        return {
          session: { state: { sessionId: "wrun_test", streamIndex: 2 } },
          response: stream([
            { type: "result.completed", data: { result: workResult } },
            { type: "session.waiting", data: {} },
          ]),
        };
      },
      attach() {
        return {
          send: async (message: string) => {
            sent.push(message);
            return stream(sendEvents);
          },
        };
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
  return (await response.text())
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

const job = {
  job: "Replies to cake orders",
  example: "Hi, can I get a chocolate cake for 20 people on Saturday?",
};
const sessionCookie = (asked = 0) =>
  `hire_session=${signSession({ sessionId: "wrun_test", asked, exp: Date.now() + 60_000 })}`;

beforeEach(() => {
  sent.length = 0;
  process.env.HIRE_SIGNING_SECRET = "route-test-secret";
  setLimitStoreForTests(memoryStore());
  setCardStoreForTests(memoryCardStore());
  setEveClientForTests(fakeClient());
});

test("work returns the structured result and sets a session cookie", async () => {
  const response = await work(post("/api/work", job));
  const list = await events(response);
  assert.deepEqual(list.at(-1), { type: "result", data: workResult });
  assert.match(
    response.headers.get("set-cookie") ?? "",
    /hire_session=.+HttpOnly/i,
  );
  assert.match(
    response.headers.get("set-cookie") ?? "",
    /Path=\/tools\/hire-an-agent;/,
  );
});

test("work rejects invalid input with 400", async () => {
  const response = await work(
    post("/api/work", { job: "x", example: "short" }),
  );
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
  const list = await events(
    await ask(post("/api/ask", { question: "What do you need?" })),
  );
  assert.equal(list.at(-1).code, "expired");
});

test("ask streams the answer and counts the question", async () => {
  setEveClientForTests(
    fakeClient([
      {
        type: "message.appended",
        data: { messageDelta: "I'd need your inbox." },
      },
    ]),
  );
  const response = await ask(
    post("/api/ask", { question: "What do you need?" }, sessionCookie(0)),
  );
  const list = await events(response);
  assert.deepEqual(list, [{ type: "delta", text: "I'd need your inbox." }]);
});

test("card strips personal data and returns a valid share token", async () => {
  const list = await events(
    await card(post("/api/card", {}, sessionCookie(1))),
  );
  const result = list.at(-1);
  assert.equal(result.type, "result");
  assert.equal(JSON.stringify(result.data).includes("jo@example.com"), false);
  assert.match(result.shareToken, /^[A-Za-z0-9_-]{8}$/);
  assert.deepEqual(await loadCard(result.shareToken), result.data);
});

test("replaying the first cookie can't get past three questions", async () => {
  setEveClientForTests(
    fakeClient([{ type: "message.appended", data: { messageDelta: "ok" } }]),
  );
  const cookie = sessionCookie(0);
  for (let i = 0; i < 3; i++)
    await (
      await ask(post("/api/ask", { question: `Question ${i}?` }, cookie))
    ).text();
  const list = await events(
    await ask(post("/api/ask", { question: "Fourth?" }, cookie)),
  );
  assert.deepEqual(list.at(-1), { type: "limit", reason: "questions" });
});

test("a session gets three cards", async () => {
  for (let i = 0; i < 3; i++) {
    const ok = await events(await card(post("/api/card", {}, sessionCookie(0))));
    assert.equal(ok.at(-1).type, "result");
  }
  const list = await events(
    await card(post("/api/card", {}, sessionCookie(0))),
  );
  assert.deepEqual(list.at(-1), { type: "limit", reason: "card" });
});

test("a session-limit pause ends the session; 'approve' can't resume it", async () => {
  setEveClientForTests(
    fakeClient([
      {
        type: "input.requested",
        data: { requests: [{ kind: "session-limit" }] },
      },
      { type: "turn.waiting", data: { on: "input" } },
    ]),
  );
  const first = await events(
    await ask(
      post("/api/ask", { question: "Tell me more?" }, sessionCookie(0)),
    ),
  );
  assert.deepEqual(first.at(-1), { type: "limit", reason: "session" });
  setEveClientForTests(
    fakeClient([
      { type: "message.appended", data: { messageDelta: "resumed" } },
    ]),
  );
  const second = await events(
    await ask(post("/api/ask", { question: "approve" }, sessionCookie(0))),
  );
  assert.deepEqual(second.at(-1), { type: "limit", reason: "session" });
});

test("work reports offline when the agent can't be reached", async () => {
  const unreachable = {
    sessions: {
      create: async () => {
        throw new Error("ECONNREFUSED");
      },
    },
  } as unknown as EveLike;
  setEveClientForTests(unreachable);
  const list = await events(await work(post("/api/work", job)));
  assert.equal(list.at(-1).code, "offline");
});

test("a correction is sent to the agent as data", async () => {
  await (
    await card(
      post("/api/card", { correction: "Never offer discounts" }, sessionCookie(1)),
    )
  ).text();
  assert.equal(JSON.parse(sent.at(-1)!).correction, "Never offer discounts");
});

test("a too-short correction is rejected", async () => {
  const response = await card(
    post("/api/card", { correction: "no" }, sessionCookie(1)),
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Write the change in 3 to 200 characters.",
  });
  assert.equal(sent.length, 0);
});

test("a card with a correction is saved and loadable", async () => {
  const list = await events(
    await card(
      post("/api/card", { correction: "Never offer discounts" }, sessionCookie(1)),
    ),
  );
  const result = list.at(-1);
  assert.equal(result.type, "result");
  assert.deepEqual(await loadCard(result.shareToken), result.data);
});
