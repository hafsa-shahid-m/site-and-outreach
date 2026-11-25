import type { Db } from "./db";
import { CHANNELS, NOTE_MAX_CHARACTERS } from "./constants";

export type Channel = (typeof CHANNELS)[number];
export type ReachoutInput = { recipientId?: unknown; channel?: unknown; note?: unknown };
export type ReachoutValue = { recipientId: number; channel: Channel; note: string | null };
export type Validation = { ok: true; value: ReachoutValue } | { ok: false; error: string };

// YOUR TURN start reachout-validate
export async function validateReachout(db: Db, input: ReachoutInput): Promise<Validation> {
  throw new Error("validateReachout is not written yet. Do chapter 6.4.");
}
// YOUR TURN end reachout-validate

// Pre-wired.
export async function createReachout(db: Db, value: ReachoutValue): Promise<number> {
  const result = await db.query(
    "insert into reachouts (recipient_id, channel, note) values ($1, $2, $3) returning id",
    [value.recipientId, value.channel, value.note],
  );
  return Number(result.rows[0].id);
}

export type RecipientOption = { id: number; name: string; token: string; proposal_slug: string };
export type RecentReachout = { id: number; name: string; channel: string; sent_at: string };

// Pre-wired. The dashboard is behind the login, so it may read tokens.
export async function listRecipients(db: Db): Promise<RecipientOption[]> {
  const result = await db.query(
    `select r.id, r.name, r.token, p.slug as proposal_slug
       from recipients r join proposals p on p.id = r.proposal_id
      order by r.created_at desc, r.id desc`,
  );
  return result.rows.map((row: RecipientOption) => ({ ...row, id: Number(row.id) }));
}

export async function listRecentReachouts(db: Db, limit = 10): Promise<RecentReachout[]> {
  const result = await db.query(
    `select ro.id, r.name, ro.channel, ro.sent_at
       from reachouts ro join recipients r on r.id = ro.recipient_id
      order by ro.sent_at desc, ro.id desc limit $1`,
    [limit],
  );
  return result.rows.map((row: RecentReachout) => ({ ...row, id: Number(row.id) }));
}
