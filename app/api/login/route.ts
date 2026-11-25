import { checkSecret, createSession } from "../../../lib/session";
import { sessionCookie } from "../../../lib/session-cookie";

export async function POST(request: Request) {
  // YOUR TURN start login-handler
  // Chapter 4.10. Check the secret, create the session, set the cookie.
  return Response.json({ error: "The login is not written yet. Do chapter 4.10." }, { status: 501 });
  // YOUR TURN end login-handler
}
