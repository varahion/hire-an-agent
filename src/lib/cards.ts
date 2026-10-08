import { randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";
import { cardResultSchema, type CardResult } from "./schemas";

// Share cards are stored server-side under a short random id, so share links
// stay short. Only the server writes cards, so they can't be forged.
const CARD_TTL_SECONDS = 365 * 24 * 60 * 60;
const ID_BYTES = 6; // 6 bytes → 8 base64url characters
export const CARD_ID = /^[A-Za-z0-9_-]{8}$/;

export type CardStore = {
  /** Store only if the id is unused; returns false on a collision. */
  putNew(id: string, card: CardResult, ttlSeconds: number): Promise<boolean>;
  get(id: string): Promise<unknown>;
};

export function memoryCardStore(): CardStore {
  const cards = new Map<string, { card: CardResult; expires: number }>();
  return {
    async putNew(id, card, ttlSeconds) {
      const existing = cards.get(id);
      if (existing && existing.expires > Date.now()) return false;
      cards.set(id, { card, expires: Date.now() + ttlSeconds * 1000 });
      return true;
    },
    async get(id) {
      const entry = cards.get(id);
      return entry && entry.expires > Date.now() ? entry.card : null;
    },
  };
}

function upstashCardStore(): CardStore | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  return {
    async putNew(id, card, ttlSeconds) {
      return (
        (await redis.set(`card:${id}`, card, { nx: true, ex: ttlSeconds })) ===
        "OK"
      );
    },
    async get(id) {
      return redis.get(`card:${id}`);
    },
  };
}

let override: CardStore | undefined;
let fallback: CardStore | undefined;

export function setCardStoreForTests(store: CardStore | undefined): void {
  override = store;
}

/** Upstash when configured; an in-memory store in development only. */
export function getCardStore(): CardStore | null {
  if (override) return override;
  const upstash = upstashCardStore();
  if (upstash) return upstash;
  if (process.env.VERCEL_ENV === "production") return null;
  fallback ??= memoryCardStore();
  return fallback;
}

/** Save a card and return its short id. */
export async function saveCard(card: CardResult): Promise<string> {
  const store = getCardStore();
  if (!store) throw new Error("No card store configured");
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = randomBytes(ID_BYTES).toString("base64url");
    if (await store.putNew(id, card, CARD_TTL_SECONDS)) return id;
  }
  throw new Error("Could not allocate a card id");
}

/** The card stored under a short id, or null. */
export async function loadCardById(id: string): Promise<CardResult | null> {
  if (!CARD_ID.test(id)) return null;
  const raw = await getCardStore()?.get(id);
  const parsed = cardResultSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
