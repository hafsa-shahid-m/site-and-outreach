import { classify } from "../../../lib/filter";
import { getDb } from "../../../lib/db";
import { clientIp } from "../../../lib/ip";
import { recordDropped, safeWrite } from "../../../lib/safe-write";
import { deviceClass, referrerHost } from "../../../lib/view-parts";
import { dailyVisitorHash } from "../../../lib/visitor";

// Pre-wired. Reads { path, referrer } from a JSON body. The beacon sends it as application/json
// or text/plain, so the body is always read as text. Returns null for anything that is not a usable view.
async function readViewBody(request: Request): Promise<{ path: string; referrer: string } | null> {
  try {
    const parsed = JSON.parse(await request.text());
    if (typeof parsed?.path !== "string") return null;
    const path = parsed.path.split("?")[0].split("#")[0];
    if (!path.startsWith("/") || path.length > 200) return null;
    if (["/p/", "/dashboard", "/login", "/api/"].some((s) => path === s.replace(/\/$/, "") || path.startsWith(s))) return null;
    return { path, referrer: typeof parsed.referrer === "string" ? parsed.referrer : "" };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // YOUR TURN start view-handler
  // Chapter 4.5. Read the body, ask classify, hash, store one row. Always answer 204.
  // YOUR TURN end view-handler
  return new Response(null, { status: 204 });
}
