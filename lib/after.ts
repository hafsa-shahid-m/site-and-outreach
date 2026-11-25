import { after } from "next/server";

// Work that runs once the answer is already sent, so the visitor never waits for it.
// Outside a real request (in a unit test) it runs at once and the test can wait for it.
const pending = new Set<Promise<void>>();

export function afterResponse(work: () => Promise<void>): void {
  try {
    after(work);
  } catch {
    const running = work().catch(() => {});
    pending.add(running);
    void running.finally(() => pending.delete(running));
  }
}

// Used by the unit tests only.
export async function settled(): Promise<void> {
  while (pending.size > 0) await Promise.all([...pending]);
}
