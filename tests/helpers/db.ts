import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import type { Db } from "../../lib/db";

// The unit tests run your real SQL against a small Postgres that lives inside the test run.
// You do not need a database, and nothing here can touch your Neon branches.

export async function makeDb(): Promise<PGlite & Db> {
  const db = new PGlite();
  await db.waitReady;
  await db.exec("set time zone 'UTC'");
  await db.exec(fs.readFileSync(path.join("db", "schema.sql"), "utf8"));
  return db as PGlite & Db;
}

export async function hasTable(db: Db, table: string): Promise<boolean> {
  const result = await db.query("select to_regclass($1) as t", [`public.${table}`]);
  return result.rows[0].t !== null;
}

// Stops a test with a plain message when a table you have not made yet is needed.
export async function need(db: Db, table: string, chapter: string, part = ""): Promise<void> {
  if (!(await hasTable(db, table))) {
    throw new Error(
      `The table "${table}" does not exist yet. Add it to db/schema.sql (chapter ${chapter}${part ? ", " + part : ""}).`,
    );
  }
}

// Loads a seed file when its tables exist. Returns false when it had to skip it.
export async function loadSeed(db: Db, lab: "lab2" | "lab3" | "lab4"): Promise<boolean> {
  const text = fs.readFileSync(path.join("db", "seeds", `${lab}.sql`), "utf8");
  const requires = (text.match(/^-- requires: (.*)$/m)?.[1] ?? "").split(",").map((s) => s.trim());
  for (const table of requires) if (!(await hasTable(db, table))) return false;
  await (db as unknown as PGlite).exec(text);
  return true;
}

// The seven seed days: the week ending yesterday.
export async function seedWeek(db: Db): Promise<{ from: string; to: string; day3: string }> {
  const r = await db.query("select (current_date - 7)::text as from, (current_date - 1)::text as to, (current_date - 5)::text as day3");
  return r.rows[0];
}

export async function clear(db: Db, tables: string[]): Promise<void> {
  for (const table of tables) {
    if (await hasTable(db, table)) await db.query(`truncate ${table} restart identity cascade`);
  }
}

export function why(chapter: string, text: string): string {
  return `Chapter ${chapter}: ${text}`;
}

// A request the way a browser sends it.
export const HUMAN_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export function post(url: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method: "POST",
    headers: { "user-agent": HUMAN_UA, "content-type": "text/plain", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
