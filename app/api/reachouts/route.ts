import { NextRequest } from "next/server";
import { getDb } from "../../../lib/db";
import { createReachout, validateReachout } from "../../../lib/reachouts";
import { readSession } from "../../../lib/session";

export async function POST(request: NextRequest) {
  // YOUR TURN start reachout-store
  // Chapter 6.4. Owner only: 401 without a session, 400 for bad input, 201 when stored.
  return Response.json({ error: "Storing reach-outs is not written yet. Do chapter 6.4." }, { status: 501 });
  // YOUR TURN end reachout-store
}
