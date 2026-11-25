import type { Metadata } from "next";
import ProposalView from "../../../components/ProposalView";
import { readProposal } from "../../../lib/proposals";

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function DemoProposal() {
  // YOUR TURN start demo-page
  // Chapter 5.4. Show the demo proposal: no lookup, nothing recorded, the recording note shown.
  return <main><h1>Demo</h1></main>;
  // YOUR TURN end demo-page
}
