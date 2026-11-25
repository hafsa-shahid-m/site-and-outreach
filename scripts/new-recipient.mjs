// node --experimental-strip-types scripts/new-recipient.mjs <proposal-slug> "Recipient name"
// Makes a link for one person: it saves the proposal, makes a recipient with a random token, and prints the link.
// Run it against the live database only with DATABASE_URL set in that one command.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import pg from "pg";
import { loadEnv } from "../db/env.mjs";
import { newToken } from "../lib/tokens.ts";

loadEnv();
const [slug, name] = process.argv.slice(2);
if (!slug || !name) {
  console.error('Usage: node --experimental-strip-types scripts/new-recipient.mjs <proposal-slug> "Recipient name"');
  process.exit(1);
}
const file = path.join("content", "proposals", `${slug}.md`);
if (!fs.existsSync(file)) {
  console.error(`There is no file ${file}. Write the proposal first (chapter 5.3).`);
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Chapter 4.4 shows how.");
  process.exit(1);
}

const title = matter(fs.readFileSync(file, "utf8")).data.title ?? slug;
const token = newToken();
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const proposal = await client.query(
    `insert into proposals (slug, title) values ($1, $2)
     on conflict (slug) do update set title = excluded.title returning id`,
    [slug, title],
  );
  await client.query("insert into recipients (proposal_id, name, token) values ($1, $2, $3)", [
    proposal.rows[0].id,
    name,
    token,
  ]);
} finally {
  await client.end();
}
const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
console.log(`${base}/p/${token}`);
