import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ProposalTracker from "../../../components/ProposalTracker";
import ProposalView from "../../../components/ProposalView";
import { afterResponse } from "../../../lib/after";
import { getDb } from "../../../lib/db";
import { classify } from "../../../lib/filter";
import { readProposal } from "../../../lib/proposals";
import { recordDropped, safeWrite } from "../../../lib/safe-write";
import { newToken } from "../../../lib/tokens";

type Recipient = { id: number; name: string; token: string; proposal_slug: string };

// YOUR TURN start proposal-page
// Chapter 5.4. Look the token up, set noindex and no-referrer, rewrite the tracked links.
// Until you do, every token shows the demo proposal.
export const metadata: Metadata = {};
async function lookupRecipient(token: string): Promise<Recipient | null> {
  return { id: 0, name: "Demo", token, proposal_slug: "demo" };
}
function rewriteTrackedLinks(html: string, token: string): string {
  return html;
}
// YOUR TURN end proposal-page

export default async function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const recipient = await lookupRecipient(token);
  if (!recipient) notFound();
  const proposal = readProposal(recipient.proposal_slug);
  if (!proposal) notFound();

  let visitKey: string | null = null;
  // YOUR TURN start record-fetched
  // Chapter 5.6. Record one fetched row per real fetch, with a visit key, after the response.
  // YOUR TURN end record-fetched

  return (
    <ProposalView proposal={proposal} rewrite={(html) => rewriteTrackedLinks(html, token)}>
      <ProposalTracker visitKey={visitKey} />
    </ProposalView>
  );
}
