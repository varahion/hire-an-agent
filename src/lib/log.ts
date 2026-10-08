/** One JSON line per event. Never pass input or output text. */
/** `reason` is a short code (e.g. "schema", "turn.failed"), never text from a turn. */
export function logEvent(event: { type: string; name: string; ok: boolean; durationMs?: number; reason?: string }): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...event }));
}
