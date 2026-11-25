import type { ReactNode } from "react";
import type { Proposal } from "../lib/proposals";
import RecordingNote from "./RecordingNote";

// Pre-wired. Draws a proposal: the title, the recording note, and each section with its id.
// The tracker reads those ids, so keep one id on each section.
export default function ProposalView({
  proposal,
  rewrite,
  children,
}: {
  proposal: Proposal;
  rewrite: (html: string) => string;
  children?: ReactNode;
}) {
  return (
    <main className="proposal">
      <h1>{proposal.title}</h1>
      <RecordingNote />
      {proposal.introHtml ? <div className="prose" dangerouslySetInnerHTML={{ __html: rewrite(proposal.introHtml) }} /> : null}
      {proposal.sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.heading}</h2>
          <div className="prose" dangerouslySetInnerHTML={{ __html: rewrite(section.html) }} />
        </section>
      ))}
      {children}
    </main>
  );
}
