"use client";

import { useProposalSignals } from "../lib/use-proposal-signals";

// Renders nothing. It watches the page and sends the opened event and the heartbeats for one visit.
export default function ProposalTracker({ visitKey }: { visitKey: string | null }) {
  useProposalSignals(visitKey);
  return null;
}
