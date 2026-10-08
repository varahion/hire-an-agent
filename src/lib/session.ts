import { signSession, verifySession, type SessionClaims } from "./signing";

const COOKIE = "hire_session";
export const SESSION_SECONDS = 3600;

/** Read and verify the signed session cookie, or null. */
export function readSession(request: Request): SessionClaims | null {
  const header = request.headers.get("cookie") ?? "";
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${COOKIE}=`));
  return match ? verifySession(match.slice(COOKIE.length + 1)) : null;
}

/** A Set-Cookie value holding the signed session. */
export function sessionCookie(claims: SessionClaims): string {
  return `${COOKIE}=${signSession(claims)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`;
}
