import type { MessageStreamEvent } from "eve/client";
import type { CardResult, WorkResult } from "./schemas";

export type AppEvent =
  | { type: "status"; text: string }
  | { type: "delta"; text: string }
  | { type: "result"; data: WorkResult | CardResult; shareToken?: string }
  | { type: "limit"; reason: "visitor" | "global" | "questions" }
  | { type: "error"; code: "offline" | "failed" | "expired" | "invalid"; message: string };

export const FAILED_MESSAGE = "The candidate lost its train of thought. Try again.";

/** Turn-ending eve events: stop reading the stream after one of these. */
export const BOUNDARY_TYPES = new Set(["session.waiting", "session.completed", "session.failed", "turn.failed"]);

/** Map one eve stream event onto the app's small event set. */
export function toAppEvents(event: MessageStreamEvent): AppEvent[] {
  const { type, data } = event as { type: string; data: Record<string, unknown> };
  switch (type) {
    case "message.appended":
      return [{ type: "delta", text: String(data.messageDelta ?? "") }];
    case "result.completed":
      return [{ type: "result", data: data.result as WorkResult | CardResult }];
    case "turn.failed":
    case "session.failed":
      return [{ type: "error", code: "failed", message: FAILED_MESSAGE }];
    default:
      return [];
  }
}

/** Stream app events to the browser as newline-delimited JSON. */
export function ndjsonResponse(events: AsyncIterable<AppEvent>, init: ResponseInit = {}): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of events) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      } catch {
        const error: AppEvent = { type: "error", code: "failed", message: FAILED_MESSAGE };
        controller.enqueue(encoder.encode(`${JSON.stringify(error)}\n`));
      } finally {
        controller.close();
      }
    },
  });
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/x-ndjson");
  headers.set("cache-control", "no-store");
  return new Response(body, { ...init, headers });
}
