import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

const DAY_SECONDS = 86_400;
const SESSION_SECONDS = 3_600;
const PER_VISITOR_PER_DAY = 3;
// Changing the user agent shouldn't buy more interviews: a looser cap per IP.
const PER_IP_PER_DAY = 5;
const QUESTIONS_PER_SESSION = 3;
const CARDS_PER_SESSION = 1;

export type LimitStore = {
  incr(key: string, ttlSeconds: number): Promise<number>;
  get(key: string): Promise<number>;
};

export function memoryStore(): LimitStore {
  const counts = new Map<string, { value: number; expires: number }>();
  const live = (key: string) => {
    const entry = counts.get(key);
    return entry && entry.expires > Date.now() ? entry : undefined;
  };
  return {
    async incr(key, ttlSeconds) {
      const entry = live(key) ?? {
        value: 0,
        expires: Date.now() + ttlSeconds * 1000,
      };
      entry.value += 1;
      counts.set(key, entry);
      return entry.value;
    },
    async get(key) {
      return live(key)?.value ?? 0;
    },
  };
}

/** Upstash store when its env vars are set (UPSTASH_REDIS_REST_* or Vercel's KV_REST_API_*); otherwise null. */
export function upstashStore(): LimitStore | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  return {
    async incr(key, ttlSeconds) {
      // INCR and EXPIRE in one round trip so a key can't be left without a TTL.
      const [value] = await redis
        .pipeline()
        .incr(key)
        .expire(key, ttlSeconds, "NX")
        .exec<[number, number]>();
      return value;
    },
    async get(key) {
      return Number((await redis.get<number>(key)) ?? 0);
    },
  };
}

let storeOverride: LimitStore | undefined;
let defaultStore: LimitStore | undefined;

/** Test hook: use this store instead of Upstash or the shared memory store. */
export function setLimitStoreForTests(store: LimitStore | undefined): void {
  storeOverride = store;
}

/**
 * The store routes use: Upstash when configured, otherwise one shared memory store.
 * In production without Upstash, returns null: a per-instance memory store would
 * silently disable every limit, so routes fail closed instead.
 */
export function getLimitStore(): LimitStore | null {
  if (storeOverride) return storeOverride;
  const upstash = upstashStore();
  if (upstash) return upstash;
  if (process.env.VERCEL_ENV === "production") return null;
  defaultStore ??= memoryStore();
  return defaultStore;
}

function dailyCap(): number {
  const value = Number(process.env.HIRE_DAILY_SESSION_CAP);
  return Number.isFinite(value) && value > 0 ? value : 300;
}

/** Count one new session for this visitor, their IP, and the day. */
export async function rateLimit(
  store: LimitStore,
  who: { visitor: string; ip: string },
  now = new Date(),
): Promise<{ ok: true } | { ok: false; reason: "visitor" | "global" }> {
  const date = now.toISOString().slice(0, 10);
  const ipCount = await store.incr(`rl:ip:${who.ip}:${date}`, DAY_SECONDS);
  if (ipCount > PER_IP_PER_DAY) return { ok: false, reason: "visitor" };
  const mine = await store.incr(`rl:v:${who.visitor}:${date}`, DAY_SECONDS);
  if (mine > PER_VISITOR_PER_DAY) return { ok: false, reason: "visitor" };
  const all = await store.incr(`rl:g:${date}`, DAY_SECONDS);
  if (all > dailyCap()) return { ok: false, reason: "global" };
  return { ok: true };
}

/** The caller's IP. Vercel sets x-real-ip; x-forwarded-for is a fallback for other hosts. */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

/** A stable, non-reversible key for a visitor: sha256 of IP + user agent. */
export function visitorKey(request: Request): string {
  const agent = request.headers.get("user-agent") ?? "";
  return createHash("sha256")
    .update(`${clientIp(request)}|${agent}`)
    .digest("hex");
}

/** A non-reversible key for the IP bucket. */
export function ipKey(request: Request): string {
  return createHash("sha256").update(clientIp(request)).digest("hex");
}

// Per-session counters live server-side, so replaying an old cookie gains nothing.

export async function countQuestion(
  store: LimitStore,
  sessionId: string,
): Promise<boolean> {
  return (
    (await store.incr(`s:q:${sessionId}`, SESSION_SECONDS)) <=
    QUESTIONS_PER_SESSION
  );
}

export async function countCard(
  store: LimitStore,
  sessionId: string,
): Promise<boolean> {
  return (
    (await store.incr(`s:c:${sessionId}`, SESSION_SECONDS)) <= CARDS_PER_SESSION
  );
}

/** Mark a session as finished for good (e.g. it reached its spend limit). */
export async function endSession(
  store: LimitStore,
  sessionId: string,
): Promise<void> {
  await store.incr(`s:end:${sessionId}`, SESSION_SECONDS);
}

export async function isSessionEnded(
  store: LimitStore,
  sessionId: string,
): Promise<boolean> {
  return (await store.get(`s:end:${sessionId}`)) > 0;
}
