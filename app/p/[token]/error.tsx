"use client";

// Pre-wired. Shown when the proposal's lookup throws, for example when the database is down.
// A Server Component page cannot choose its own status, so the answer is 500 with this page.
export default function ProposalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <h1>Please try again in a minute</h1>
      <p>This page could not load right now. Nothing is wrong with your link.</p>
      <button type="button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
