import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

const DAY_SECONDS = 86_400;
const PER_VISITOR_PER_DAY = 3;

export type LimitStore = { incr(key: string, ttlSeconds: number): Promise<number> };

export function memoryStore(): LimitStore {
  const counts = new Map<string, { value: number; expires: number }>();
  return {
    async incr(key, ttlSeconds) {
      const now = Date.now();
      const current = counts.get(key);
      const entry =
        current && current.expires > now ? current : { value: 0, expires: now + ttlSeconds * 1000 };
      entry.value += 1;
      counts.set(key, entry);
      return entry.value;
    },
  };
}

/** Upstash store when its env vars are set; otherwise null so callers fall back to memory. */
export function upstashStore(): LimitStore | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  const redis = Redis.fromEnv();
  return {
    async incr(key, ttlSeconds) {
      const value = await redis.incr(key);
      if (value === 1) await redis.expire(key, ttlSeconds);
      return value;
    },
  };
}

function dailyCap(): number {
  const value = Number(process.env.HIRE_DAILY_SESSION_CAP);
  return Number.isFinite(value) && value > 0 ? value : 300;
}

/** Count one new session for this visitor and for the day. */
export async function rateLimit(
  store: LimitStore,
  visitor: string,
  now = new Date(),
): Promise<{ ok: true } | { ok: false; reason: "visitor" | "global" }> {
  const date = now.toISOString().slice(0, 10);
  const mine = await store.incr(`rl:v:${visitor}:${date}`, DAY_SECONDS);
  if (mine > PER_VISITOR_PER_DAY) return { ok: false, reason: "visitor" };
  const all = await store.incr(`rl:g:${date}`, DAY_SECONDS);
  if (all > dailyCap()) return { ok: false, reason: "global" };
  return { ok: true };
}

/** A stable, non-reversible key for a visitor: sha256 of IP + user agent. */
export function visitorKey(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const agent = request.headers.get("user-agent") ?? "";
  return createHash("sha256").update(`${ip}|${agent}`).digest("hex");
}
