import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getDb } from "./db";
import { SESSION_DAYS } from "./constants";

export type Session = { id: string; expires_at: Date };

// Pre-wired. Compares two buffers in constant time. Different lengths are simply not equal.
export function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

// Pre-wired. Logout deletes the row.
export async function deleteSession(id: string | undefined): Promise<void> {
  if (!id) return;
  await getDb().query("delete from sessions where id = $1", [id]);
}

// YOUR TURN start check-secret
export function checkSecret(given: string): boolean {
  throw new Error("checkSecret is not written yet. Do chapter 4.10.");
}
// YOUR TURN end check-secret

// YOUR TURN start create-session
export async function createSession(): Promise<Session> {
  throw new Error("createSession is not written yet. Do chapter 4.10.");
}
// YOUR TURN end create-session

// YOUR TURN start read-session
// Until chapter 4.10 there is no session: the owner is never recognised.
export async function readSession(cookieValue: string | undefined): Promise<Session | null> {
  return null;
}
// YOUR TURN end read-session
