import {
  cardResultSchema,
  workResultSchema,
  type CardResult,
  type WorkResult,
} from "./schemas";

// Models occasionally run slightly past a length limit. Trim to fit rather than
// fail the visitor; anything still invalid after trimming is a real failure.

function text(value: unknown, max: number): string {
  const s = typeof value === "string" ? value.trim() : "";
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

function list(value: unknown, maxItems: number, maxChars: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => text(item, maxChars))
    .filter(Boolean)
    .slice(0, maxItems);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function coerceCard(raw: unknown): CardResult | null {
  if (!isObject(raw)) return null;
  const hours = Number(raw.hoursSavedPerWeek);
  const candidate = {
    role: text(raw.role, 60),
    does: list(raw.does, 4, 120),
    needs: list(raw.needs, 4, 120),
    humanDecides: list(raw.humanDecides, 3, 120),
    hoursSavedPerWeek: Number.isFinite(hours)
      ? Math.min(40, Math.max(0.5, hours))
      : NaN,
    assumption: text(raw.assumption, 140),
  };
  const parsed = cardResultSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export function coerceWork(raw: unknown): WorkResult | null {
  if (!isObject(raw)) return null;
  const declined = isObject(raw.declined)
    ? {
        reason: text(raw.declined.reason, 300),
        suggestion: text(raw.declined.suggestion, 300),
      }
    : undefined;
  const candidate = {
    understood: list(raw.understood, 4, 200),
    missing: list(raw.missing, 4, 200),
    draft: text(raw.draft, 1500),
    ...(declined ? { declined } : {}),
  };
  const parsed = workResultSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}
