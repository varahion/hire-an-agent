import { coerceCard } from "@/lib/coerce";
import { getEveClient } from "@/lib/eve";
import { logEvent } from "@/lib/log";
import { stripPiiFromCard } from "@/lib/pii";
import { CARD_MESSAGE } from "@/lib/prompts";
import { requestGuard } from "@/lib/request";
import { cardResultSchema, type CardResult } from "@/lib/schemas";
import { readSession } from "@/lib/session";
import { signCard } from "@/lib/signing";
import { ndjsonResponse, type AppEvent } from "@/lib/stream";
import { EXPIRED_MESSAGE, OFFLINE_MESSAGE, once, runTurn, safely } from "@/lib/turn";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const blocked = requestGuard(request);
  if (blocked) return blocked;

  const session = readSession(request);
  if (!session) return ndjsonResponse(once({ type: "error", code: "expired", message: EXPIRED_MESSAGE }));

  const client = getEveClient();
  if (!client) return ndjsonResponse(once({ type: "error", code: "offline", message: OFFLINE_MESSAGE }));

  const started = Date.now();

  async function* events(): AsyncIterable<AppEvent> {
    yield { type: "status", text: "Writing the CV card…" };
    let ok = false;
    let reason: string | undefined;
    const onFailure = (code: string) => (reason = code);
    for await (const event of safely(async () => {
      const response = await client!.sessions
        .attach(session!.sessionId)
        .send(CARD_MESSAGE, { outputSchema: cardResultSchema, signal: AbortSignal.timeout(45_000) });
      return runTurn(response, { deltas: false, schema: cardResultSchema, coerce: coerceCard, onFailure });
    }, onFailure)) {
      if (event.type === "result") {
        // Backstop: the card is public, so strip personal data before signing it.
        const card = stripPiiFromCard(event.data as CardResult);
        ok = true;
        yield { type: "result", data: card, shareToken: signCard(card) };
        continue;
      }
      yield event;
    }
    logEvent({ type: "turn", name: "card", ok, durationMs: Date.now() - started, reason });
  }

  return ndjsonResponse(events());
}
