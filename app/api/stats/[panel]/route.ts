import { NextRequest } from "next/server";
import { getDb, type Db } from "../../../../lib/db";
import { parseRange, type Range } from "../../../../lib/range";
import { readSession } from "../../../../lib/session";
import * as stats from "../../../../lib/stats";

type Panel = (db: Db, range: Range) => Promise<unknown>;

// YOUR TURN start stats-routes
// Chapters 4.11, 5.9, 6.7 and 6.8. Add one line for each panel as you write its query:
// views-per-day, visitors-per-day, top-pages, referrers, proposals, blog-reads, clicks, funnel, filtered-share.
const PANELS: Record<string, Panel> = {};
// YOUR TURN end stats-routes

export async function GET(request: NextRequest, { params }: { params: Promise<{ panel: string }> }) {
  const { panel } = await params;

  // YOUR TURN start stats-guard
  // Chapter 4.10. Check the session. Until you do, the door is shut.
  const doorShut: boolean = true;
  if (doorShut) return Response.json({ error: "Log in first." }, { status: 401 });
  // YOUR TURN end stats-guard

  const run = Object.prototype.hasOwnProperty.call(PANELS, panel) ? PANELS[panel] : undefined;
  if (!run) return Response.json({ error: "No such panel." }, { status: 404 });
  const result = await run(getDb(), parseRange(new URL(request.url).searchParams));
  return Response.json(result, { headers: { "cache-control": "no-store" } });
}
