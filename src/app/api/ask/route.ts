import { getEveClient } from "@/lib/eve";
import { logEvent } from "@/lib/log";
import { readBody, requestGuard } from "@/lib/request";
import { questionSchema } from "@/lib/schemas";
import { readSession, sessionCookie } from "@/lib/session";
import { ndjsonResponse, type AppEvent } from "@/lib/stream";
import { EXPIRED_MESSAGE, OFFLINE_MESSAGE, once, runTurn, safely } from "@/lib/turn";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_QUESTIONS = 3;

export async function POST(request: Request) {
  const blocked = requestGuard(request);
  if (blocked) return blocked;
  let raw: unknown;
  try {
    raw = await readBody(request);
  } catch {
    return Response.json({ error: "Please send a question under 16 KB." }, { status: 400 });
  }
  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success)
    return Response.json({ error: "Ask a question of 3 to 300 characters." }, { status: 400 });

  const session = readSession(request);
  if (!session) return ndjsonResponse(once({ type: "error", code: "expired", message: EXPIRED_MESSAGE }));
  if (session.asked >= MAX_QUESTIONS) return ndjsonResponse(once({ type: "limit", reason: "questions" }));

  const client = getEveClient();
  if (!client) return ndjsonResponse(once({ type: "error", code: "offline", message: OFFLINE_MESSAGE }));

  const cookie = sessionCookie({ ...session, asked: session.asked + 1 });
  const started = Date.now();

  async function* events(): AsyncIterable<AppEvent> {
    let ok = true;
    let reason: string | undefined;
    const onFailure = (code: string) => (reason = code);
    for await (const event of safely(async () => {
      const response = await client!.sessions
        .attach(session!.sessionId)
        .send(parsed.data!.question, { signal: AbortSignal.timeout(45_000) });
      return runTurn(response, { deltas: true, onFailure });
    }, onFailure)) {
      if (event.type === "error") ok = false;
      yield event;
    }
    logEvent({ type: "turn", name: "ask", ok, durationMs: Date.now() - started, reason });
  }

  return ndjsonResponse(events(), { headers: { "set-cookie": cookie } });
}
