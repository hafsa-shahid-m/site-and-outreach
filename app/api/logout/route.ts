import { NextRequest } from "next/server";
import { deleteSession } from "../../../lib/session";
import { clearedSessionCookie } from "../../../lib/session-cookie";

// Pre-wired. Deletes the session row and clears the cookie.
export async function POST(request: NextRequest) {
  try {
    await deleteSession(request.cookies.get("session")?.value);
  } catch {
    // the cookie is cleared even if the database is asleep
  }
  return new Response(null, { status: 204, headers: { "set-cookie": clearedSessionCookie() } });
}
