/** One JSON line per event. Never pass input or output text. */
export function logEvent(event: { type: string; name: string; ok: boolean; durationMs?: number }): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...event }));
}
