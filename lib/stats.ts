import type { Db } from "./db";
import type { Range } from "./range";
import { SHARE_MIN_BASE, TOO_FEW_LABEL } from "./constants";

// Every panel query has the shape fn(db, { from, to }). from and to are YYYY-MM-DD, cut in UTC.

export type DayViews = { day: string; views: number };
export type DayVisitors = { day: string; visitors: number };
export type PageViews = { path: string; views: number };
export type ReferrerViews = { referrer: string; views: number };
export type Share = { part: number; base: number; percent: number | null; label: string | null };

export type ProposalRow = {
  recipient_id: number;
  name: string;
  proposal: string;
  link_made: string;
  fetched: number;
  first_open: string | null;
  open_count: number;
  visible_seconds: number;
  sections: string[];
};
export type ClickRow = { slug: string; with_recipient: number; public_clicks: number };
export type FunnelRow = { reachout_id: number; name: string; channel: string; sent_at: string; opened: boolean; clicked: boolean };
export type Funnel = {
  rows: FunnelRow[];
  sent: number;
  opened: number;
  clicked: number;
  openedShare: Share;
  clickedShare: Share;
};
export type Filtered = { dropped: number; views: number; base: number; share: Share };

// The rows of one table that fall inside the range, cut in UTC.
const inRange = (column: string) => `(${column} at time zone 'UTC')::date between $1::date and $2::date`;

// YOUR TURN start views-per-day
export async function viewsPerDay(db: Db, range: Range): Promise<DayViews[]> {
  throw new Error("viewsPerDay is not written yet. Do chapter 4.11.");
}
// YOUR TURN end views-per-day

// YOUR TURN start visitors-per-day
export async function visitorsPerDay(db: Db, range: Range): Promise<DayVisitors[]> {
  throw new Error("visitorsPerDay is not written yet. Do chapter 4.11.");
}
// YOUR TURN end visitors-per-day

// YOUR TURN start top-pages
export async function topPages(db: Db, range: Range): Promise<PageViews[]> {
  throw new Error("topPages is not written yet. Do chapter 4.11.");
}
// YOUR TURN end top-pages

// YOUR TURN start referrers
export async function referrers(db: Db, range: Range): Promise<ReferrerViews[]> {
  throw new Error("referrers is not written yet. Do chapter 4.11.");
}
// YOUR TURN end referrers

// Pre-wired. Postgres has no aggregate for a union of arrays, so this runs as its own query.
export async function sectionsByRecipient(db: Db): Promise<Map<number, string[]>> {
  const result = await db.query(
    `select r.id, array(select distinct s from proposal_visits v, unnest(v.sections_seen) s
                         where v.recipient_id = r.id order by s) as sections
       from recipients r`,
  );
  return new Map(result.rows.map((row: { id: number | string; sections: string[] }) => [Number(row.id), row.sections ?? []]));
}

// YOUR TURN start proposal-status
export async function proposalStatus(db: Db, range: Range): Promise<ProposalRow[]> {
  throw new Error("proposalStatus is not written yet. Do chapter 5.9.");
}
// YOUR TURN end proposal-status

// YOUR TURN start share
export function share(part: number, base: number): Share {
  throw new Error("share is not written yet. Do chapter 6.7.");
}
// YOUR TURN end share

// YOUR TURN start blog-reads
export async function blogReads(db: Db, range: Range): Promise<PageViews[]> {
  throw new Error("blogReads is not written yet. Do chapter 6.7.");
}
// YOUR TURN end blog-reads

// YOUR TURN start stats-clicks
export async function clicks(db: Db, range: Range): Promise<ClickRow[]> {
  throw new Error("clicks is not written yet. Do chapter 6.8.");
}
// YOUR TURN end stats-clicks

// The funnel, per reach-out: sent (the row), opened and clicked. The pre-wired query below joins each
// reach-out to that recipient's visits and clicks. The two conditions decide what counts.
// YOUR TURN start stats-funnel
// Chapter 6.8. These two conditions ignore the time the reach-out was sent. Fix them.
const OPENED_AFTER_SENT = "v.opened_at is not null";
const CLICKED_AFTER_SENT = "true";
// YOUR TURN end stats-funnel

export async function funnel(db: Db, range: Range): Promise<Funnel> {
  const result = await db.query(
    `with per_reachout as (
       select ro.id, ro.recipient_id, ro.channel, ro.sent_at,
              exists (select 1 from proposal_visits v
                       where v.recipient_id = ro.recipient_id and ${OPENED_AFTER_SENT}) as opened,
              exists (select 1 from clicks c
                       where c.recipient_id = ro.recipient_id and ${CLICKED_AFTER_SENT}) as clicked
         from reachouts ro
        where ${inRange("ro.sent_at")}
     )
     select p.id as reachout_id, r.name, p.channel, p.sent_at, p.opened, p.clicked
       from per_reachout p join recipients r on r.id = p.recipient_id
      order by p.sent_at asc, p.id asc`,
    [range.from, range.to],
  );
  const rows: FunnelRow[] = result.rows;
  const sent = rows.length;
  const opened = rows.filter((row) => row.opened).length;
  const clicked = rows.filter((row) => row.clicked).length;
  return { rows, sent, opened, clicked, openedShare: share(opened, sent), clickedShare: share(clicked, sent) };
}

// YOUR TURN start stats-filtered
export async function filteredShare(db: Db, range: Range): Promise<Filtered> {
  throw new Error("filteredShare is not written yet. Do chapter 6.8.");
}
// YOUR TURN end stats-filtered
