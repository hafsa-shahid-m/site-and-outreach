// node db/migrate.mjs            runs db/schema.sql (safe to run again)
// node db/migrate.mjs --seed     then loads each seed file whose tables all exist, into a dev database only
// node db/migrate.mjs --seed --reseed   loads a seed again even if it is already there
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import pg from "pg";
import { loadEnv } from "./env.mjs";

loadEnv();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Chapter 4.4 shows how to put it in .env.local.");
  process.exit(1);
}

const args = process.argv.slice(2);
const wantSeed = args.includes("--seed");
const reseed = args.includes("--reseed");
const host = new URL(url).host;

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
} catch (error) {
  console.error(`Could not connect to ${host}: ${error.code ?? error.message}`);
  process.exit(1);
}
await client.query("set time zone 'UTC'");

try {
  const schema = fs.readFileSync(path.join("db", "schema.sql"), "utf8");
  await client.query(schema);
  console.log(`Schema is up to date on ${host}.`);

  if (wantSeed) {
    console.log(`The seed is about to be written to: ${host}`);
    let answer = process.env.SEED_CONFIRM;
    if (answer === undefined) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      answer = await rl.question("This must be your dev database. Type dev to go on: ");
      rl.close();
    }
    if (answer.trim() !== "dev") {
      console.log("Stopped. Nothing was written.");
      process.exit(0);
    }
    const dates = (await client.query("select (current_date - 7)::text as first, (current_date - 1)::text as last")).rows[0];
    console.log(`The seed week runs from ${dates.first} to ${dates.last}.`);
    const files = fs.readdirSync(path.join("db", "seeds")).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      const name = file.replace(/\.sql$/, "");
      const text = fs.readFileSync(path.join("db", "seeds", file), "utf8");
      const requires = (text.match(/^-- requires: (.*)$/m)?.[1] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      const loadedIf = text.match(/^-- loaded-if: (.*)$/m)?.[1];
      const missing = [];
      for (const table of requires) {
        const found = await client.query("select to_regclass($1) as t", [`public.${table}`]);
        if (!found.rows[0].t) missing.push(table);
      }
      if (missing.length > 0) {
        console.log(`Skipped ${name}: these tables do not exist yet: ${missing.join(", ")}.`);
        continue;
      }
      if (loadedIf && !reseed) {
        const already = await client.query(loadedIf);
        if (already.rows.length > 0) {
          console.log(`Skipped ${name}: it is already loaded. Use --reseed to load it again.`);
          continue;
        }
      }
      await client.query(text);
      console.log(`Loaded ${name} (${requires.join(", ")}).`);
    }
  }
} catch (error) {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
