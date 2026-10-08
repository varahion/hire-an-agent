import { Client } from "eve/client";

/** The part of eve's Client this app uses, so tests can swap in a fake. */
export type EveLike = Pick<Client, "sessions">;

let override: EveLike | null | undefined;

/** Test hook: pass a fake client, null for "not configured", or undefined to reset. */
export function setEveClientForTests(client: EveLike | null | undefined): void {
  override = client;
}

/** The eve client, or null when the agent isn't enabled or configured. */
export function getEveClient(): EveLike | null {
  if (override !== undefined) return override;
  const { EVE_ENABLED, EVE_SERVICE_TOKEN, EVE_AGENT_ORIGIN } = process.env;
  if (EVE_ENABLED !== "true" || !EVE_SERVICE_TOKEN || !EVE_AGENT_ORIGIN)
    return null;
  return new Client({
    host: EVE_AGENT_ORIGIN,
    auth: { bearer: EVE_SERVICE_TOKEN },
    redirect: "error",
  });
}
