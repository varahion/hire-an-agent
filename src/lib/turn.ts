import type { MessageStreamEvent } from "eve/client";
import type { ZodType } from "zod";
import { BOUNDARY_TYPES, FAILED_MESSAGE, toAppEvents, type AppEvent } from "./stream";

export const OFFLINE_MESSAGE = "The interview is offline right now.";
export const EXPIRED_MESSAGE = "This interview has ended. Start a new one.";

/** Yield a single event (for limits, offline and expiry responses). */
export async function* once(event: AppEvent): AsyncIterable<AppEvent> {
  yield event;
}

/**
 * Read one eve turn and yield app events until the turn boundary.
 * `deltas`: forward streamed text. `schema`: validate the structured result.
 */
export async function* runTurn(
  response: AsyncIterable<MessageStreamEvent>,
  options: { deltas: boolean; schema?: ZodType; coerce?: (raw: unknown) => unknown; onFailure?: (reason: string) => void },
): AsyncIterable<AppEvent> {
  let gotResult = false;
  for await (const event of response) {
    for (const appEvent of toAppEvents(event)) {
      if (appEvent.type === "delta" && !options.deltas) continue;
      if (appEvent.type === "result") {
        let data: unknown = appEvent.data;
        if (options.schema && !options.schema.safeParse(data).success) {
          data = options.coerce?.(data) ?? null;
          if (data === null) {
            options.onFailure?.("schema");
            yield { type: "error", code: "failed", message: FAILED_MESSAGE };
            return;
          }
          options.onFailure?.("coerced");
        }
        gotResult = true;
        yield { type: "result", data: data as never };
        continue;
      }
      if (appEvent.type === "error") options.onFailure?.((event as { type: string }).type);
      yield appEvent;
      if (appEvent.type === "error") return;
    }
    if (BOUNDARY_TYPES.has((event as { type: string }).type)) break;
  }
  if (options.schema && !gotResult) {
    options.onFailure?.("no-result");
    yield { type: "error", code: "failed", message: FAILED_MESSAGE };
  }
}

/** Run a source of events, turning any thrown error (timeout, network) into a failed event. */
export async function* safely(
  source: () => Promise<AsyncIterable<AppEvent>> | AsyncIterable<AppEvent>,
  onFailure?: (reason: string) => void,
): AsyncIterable<AppEvent> {
  try {
    yield* await source();
  } catch (error) {
    onFailure?.(error instanceof Error ? `exception:${error.name}` : "exception");
    yield { type: "error", code: "failed", message: FAILED_MESSAGE };
  }
}
