import { coerceWork } from "@/lib/coerce";
import { getEveClient } from "@/lib/eve";
import { getLimitStore, ipKey, rateLimit, visitorKey } from "@/lib/limits";
import { logEvent } from "@/lib/log";
import { workMessage } from "@/lib/prompts";
import { readBody, requestGuard } from "@/lib/request";
import { jobInputSchema, workResultSchema } from "@/lib/schemas";
import { SESSION_SECONDS, sessionCookie } from "@/lib/session";
import { ndjsonResponse, type AppEvent } from "@/lib/stream";
import { OFFLINE_MESSAGE, once, runTurn } from "@/lib/turn";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const blocked = requestGuard(request);
  if (blocked) return blocked;
  let raw: unknown;
  try {
    raw = await readBody(request);
  } catch {
    return Response.json(
      { error: "Please send a job and an example under 16 KB." },
      { status: 400 },
    );
  }
  const parsed = jobInputSchema.safeParse(raw);
  if (!parsed.success)
    return Response.json(
      {
        error:
          "Describe the job in up to 200 characters and paste an example of 20 to 3,000 characters.",
      },
      { status: 400 },
    );

  const client = getEveClient();
  const store = getLimitStore();
  if (!client || !store)
    return ndjsonResponse(
      once({ type: "error", code: "offline", message: OFFLINE_MESSAGE }),
    );

  const limit = await rateLimit(store, {
    visitor: visitorKey(request),
    ip: ipKey(request),
  });
  if (!limit.ok) {
    logEvent({ type: "limit", name: limit.reason, ok: false });
    return ndjsonResponse(once({ type: "limit", reason: limit.reason }));
  }

  const started = Date.now();
  const created = await client.sessions
    .create({
      message: workMessage(parsed.data),
      outputSchema: workResultSchema,
      signal: AbortSignal.timeout(45_000),
    })
    .catch(() => null);
  if (!created) {
    // The agent couldn't be reached: say it's offline rather than blame the candidate.
    logEvent({
      type: "turn",
      name: "work",
      ok: false,
      durationMs: Date.now() - started,
      reason: "unreachable",
    });
    return ndjsonResponse(
      once({ type: "error", code: "offline", message: OFFLINE_MESSAGE }),
    );
  }

  const cookie = sessionCookie({
    sessionId: created.session.state.sessionId,
    asked: 0,
    exp: Date.now() + SESSION_SECONDS * 1000,
  });
  const response = created.response;

  async function* events(): AsyncIterable<AppEvent> {
    yield { type: "status", text: "Reading your example…" };
    let ok = false;
    let reason: string | undefined;
    const onFailure = (code: string) => (reason = code);
    for await (const event of runTurn(response, {
      deltas: false,
      schema: workResultSchema,
      coerce: coerceWork,
      onFailure,
    })) {
      if (event.type === "result") ok = true;
      yield event;
    }
    logEvent({
      type: "turn",
      name: "work",
      ok,
      durationMs: Date.now() - started,
      reason,
    });
  }

  return ndjsonResponse(events(), { headers: { "set-cookie": cookie } });
}
