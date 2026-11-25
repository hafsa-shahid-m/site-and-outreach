import { getDb } from "../../../lib/db";
import { classify } from "../../../lib/filter";
import { isOpened } from "../../../lib/open-rule";
import { safeWrite } from "../../../lib/safe-write";

// Pre-wired. Keep the larger seconds and the union of sections. A visit that was never opened is not updated.
// greatest() keeps the larger number, unnest() turns the lists into rows, distinct drops repeats,
// so a lost, late or repeated heartbeat does no harm.
const MERGE_HEARTBEAT_SQL = `update proposal_visits
   set visible_seconds = greatest(visible_seconds, $2),
       sections_seen = array(select distinct unnest(sections_seen || $3::text[]))
 where visit_key = $1 and opened_at is not null`;

// Pre-wired. The page sends JSON as application/json or text/plain, so the body is read as text.
async function readEvent(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed = JSON.parse(await request.text());
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await readEvent(request);
    if (body && typeof body.visit_key === "string" && body.visit_key.length > 0 && body.visit_key.length <= 64) {
      const visitKey = body.visit_key;
      if (body.kind === "opened") {
        // YOUR TURN start opened-handler
        // Chapter 5.6. Find the visit by its key, run isOpened, set opened_at once.
        // YOUR TURN end opened-handler
      } else if (body.kind === "heartbeat") {
        // YOUR TURN start heartbeat-handler
        // Chapter 5.8. Check the body, ignore the owner, run MERGE_HEARTBEAT_SQL.
        // YOUR TURN end heartbeat-handler
      }
    }
  } catch (error) {
    console.error(`[proposal-event] ${(error as Error).message}`);
  }
  return new Response(null, { status: 204 });
}
