import { getDb } from "./db";

// Runs a tracking write. When the database fails, it writes one log line and carries on,
// so a visitor never sees an error because of a counter.
export async function safeWrite(label: string, write: () => Promise<unknown>): Promise<boolean> {
  try {
    await write();
    return true;
  } catch (error) {
    const e = error as { code?: string; message?: string };
    console.error(`[safe-write] ${label} failed: ${e.code ?? e.message ?? "unknown error"}`);
    return false;
  }
}

// One row in the dropped table: when, which page kind and why. Never any data about a person.
export async function recordDropped(surface: "view" | "proposal" | "click", reason: string): Promise<void> {
  await safeWrite(`dropped (${surface}, ${reason})`, () =>
    getDb().query("insert into dropped (surface, reason) values ($1, $2)", [surface, reason]),
  );
}
