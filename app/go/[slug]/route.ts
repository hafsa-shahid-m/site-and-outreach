import { NextRequest } from "next/server";
import { afterResponse } from "../../../lib/after";
import { getDb } from "../../../lib/db";
import { classify } from "../../../lib/filter";
import { recordDropped, safeWrite } from "../../../lib/safe-write";
import { findLink } from "../../../links";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // The target comes from links.ts, in code. It is never read from the request.
  const target = findLink(slug);

  // YOUR TURN start go-redirect
  // Chapter 6.3. The starter answers 307 and nothing else. Add what is missing, and the 404 page.
  if (!target) return new Response("Not found", { status: 404 });
  const response = new Response(null, { status: 307, headers: { Location: target } });
  // YOUR TURN end go-redirect

  // YOUR TURN start go-filter
  // Chapter 6.3. Ask classify once. Read ?r= and keep it only when it is a known recipient.
  const recipientToken: string | null = null;
  async function shouldRecord(): Promise<boolean> {
    return false;
  }
  // YOUR TURN end go-filter

  // YOUR TURN start go-record
  // Chapter 6.3. After the response, record one click through safeWrite.
  // YOUR TURN end go-record

  return response;
}

export const HEAD = GET;
