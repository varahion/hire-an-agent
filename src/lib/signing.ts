import { createHmac, timingSafeEqual } from "node:crypto";
import { cardResultSchema, type CardResult } from "./schemas";

export type SessionClaims = { sessionId: string; asked: number; exp: number };

function secret(): string {
  const value = process.env.HIRE_SIGNING_SECRET;
  if (!value) throw new Error("HIRE_SIGNING_SECRET is not set");
  return value;
}

function sign(payload: unknown): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verify(token: string): unknown | null {
  const [body, mac, extra] = token.split(".");
  if (!body || !mac || extra !== undefined) return null;
  const expected = createHmac("sha256", secret()).update(body).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(mac, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function signSession(claims: SessionClaims): string {
  return sign(claims);
}

export function verifySession(token: string, now = Date.now()): SessionClaims | null {
  const data = verify(token) as Partial<SessionClaims> | null;
  if (
    !data ||
    typeof data.sessionId !== "string" ||
    typeof data.asked !== "number" ||
    typeof data.exp !== "number" ||
    data.exp <= now
  )
    return null;
  return { sessionId: data.sessionId, asked: data.asked, exp: data.exp };
}

export function signCard(card: CardResult, issuedAt = Date.now()): string {
  return sign({ card, issuedAt });
}

export function verifyCard(token: string): { card: CardResult; issuedAt: number } | null {
  const data = verify(token) as { card?: unknown; issuedAt?: unknown } | null;
  if (!data || typeof data.issuedAt !== "number") return null;
  const card = cardResultSchema.safeParse(data.card);
  return card.success ? { card: card.data, issuedAt: data.issuedAt } : null;
}
