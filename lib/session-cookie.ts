import { SESSION_COOKIE, SESSION_DAYS } from "./constants";

// Reads one cookie from a request's headers.
export function readCookie(headers: Headers, name: string): string | undefined {
  const header = headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return undefined;
}

// The Set-Cookie text for a new session: HttpOnly (script cannot read it), Secure (https only),
// SameSite=Lax (not sent on cross-site posts), 30 days.
export function sessionCookie(id: string): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${id}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
