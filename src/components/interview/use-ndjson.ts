import type { AppEvent } from "@/lib/stream";

/** Read a newline-delimited JSON response as a stream of app events. */
export async function* readNdjson(response: Response): AsyncIterable<AppEvent> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) yield JSON.parse(line) as AppEvent;
      newline = buffer.indexOf("\n");
    }
    if (done) break;
  }
  const last = (buffer + decoder.decode()).trim();
  if (last) yield JSON.parse(last) as AppEvent;
}

/**
 * POST JSON to one of the app's routes and hand each event to `onEvent`.
 * Non-stream errors (400, 403, 415) become an "invalid" error event.
 */
export async function postStream(
  url: string,
  body: unknown,
  onEvent: (event: AppEvent) => void,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    onEvent({
      type: "error",
      code: "failed",
      message:
        "We couldn't reach the interview. Check your connection and try again.",
    });
    return;
  }
  if (!response.headers.get("content-type")?.includes("application/x-ndjson")) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    onEvent({
      type: "error",
      code: "invalid",
      message: data.error ?? "Something went wrong. Please try again.",
    });
    return;
  }
  try {
    for await (const event of readNdjson(response)) onEvent(event);
  } catch {
    onEvent({
      type: "error",
      code: "failed",
      message: "The candidate lost its train of thought. Try again.",
    });
  }
}
