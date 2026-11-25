// npm run doctor
// Phase 1 (from chapter 1.2): Node, Git and the build.
// Phase 2 (from chapter 4.4): the environment variables and the database. It runs when .env.local exists,
// when DATABASE_URL is set, or when you pass --phase=2.
// node scripts/doctor.mjs --list     prints the names of the checks (used to count them)
// node scripts/doctor.mjs --quick    skips the build
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import pg from "pg";
import { loadEnv } from "../db/env.mjs";

const args = process.argv.slice(2);
const wantPhase2 = args.includes("--phase=2") || fs.existsSync(".env.local") || Boolean(process.env.DATABASE_URL);
loadEnv();

const phase1 = [
  {
    name: "Node is new enough",
    run: () => {
      const major = Number(process.versions.node.split(".")[0]);
      if (major < 22) {
        throw new Error(`You have Node ${process.versions.node}. The course uses Node 24 (22 also works). Install Node 24 LTS from nodejs.org and open a new terminal.`);
      }
      return `Node ${process.versions.node}${major < 24 ? " (the course uses 24, but 22 works)" : ""}`;
    },
  },
  {
    name: "npm is installed",
    run: () => `npm ${execSync("npm -v", { encoding: "utf8" }).trim()}`,
  },
  {
    name: "Git is installed",
    run: () => {
      try {
        return execSync("git --version", { encoding: "utf8" }).trim();
      } catch {
        throw new Error("Git is not installed. Install it from git-scm.com, then open a new terminal.");
      }
    },
  },
  {
    name: "This folder is a Git repository",
    run: () => {
      try {
        execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
        return "inside a repository";
      } catch {
        throw new Error("This folder is not a Git repository. Clone your copy of the template (chapter 1.2).");
      }
    },
  },
  {
    name: "The packages are installed",
    run: () => {
      try {
        createRequire(import.meta.url).resolve("next/package.json");
        return "next is installed";
      } catch {
        throw new Error("The packages are missing or the install stopped half way. Run: npm install");
      }
    },
  },
  {
    name: "The site builds",
    run: () => {
      if (args.includes("--quick")) return "skipped (--quick)";
      const result = spawnSync("npx", ["next", "build"], { encoding: "utf8", shell: true });
      if (result.status !== 0) {
        const tail = `${result.stdout}\n${result.stderr}`.trim().split("\n").slice(-12).join("\n");
        throw new Error(`The build failed. The last lines say:\n${tail}`);
      }
      return "next build finished";
    },
  },
];

function describeDbError(error) {
  const code = error.code ?? "";
  if (code === "28P01") return "The database refused the password. Check the password in DATABASE_URL.";
  if (code === "28000" || code === "42501") return "The database refused the user. Check the user name in DATABASE_URL.";
  if (code === "3D000") return "The database name in DATABASE_URL does not exist.";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "The host name in DATABASE_URL was not found. Check the host part of the address.";
  if (code === "ECONNREFUSED") return "Nothing answered at the host and port in DATABASE_URL. Check the host and port, and that the database is running.";
  if (error.message?.includes("timeout")) return "The database did not answer in time. A sleeping Neon database can take a few seconds. Run the check again.";
  return `The database step failed: ${error.message}`;
}

const phase2 = [
  {
    name: "DATABASE_URL is set",
    run: () => {
      if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing. Put your dev connection string in .env.local (chapter 4.4).");
      return `host ${new URL(process.env.DATABASE_URL).host}`;
    },
  },
  {
    name: "OWNER_SECRET is set",
    run: () => {
      if (!process.env.OWNER_SECRET) throw new Error("OWNER_SECRET is missing. Make one with the command in chapter 4.4.");
      return "set (the value is never printed)";
    },
  },
  {
    name: "VISITOR_SECRET is set",
    run: () => {
      if (!process.env.VISITOR_SECRET) throw new Error("VISITOR_SECRET is missing. Make one with the command in chapter 4.4.");
      return "set (the value is never printed)";
    },
  },
  {
    name: ".env.local is ignored by Git",
    run: () => {
      try {
        execSync("git check-ignore .env.local", { stdio: "ignore" });
        return ".env.local will never be committed";
      } catch {
        throw new Error(".env.local is not ignored by Git. Add a line .env.local to .gitignore before you put a secret in it.");
      }
    },
  },
  {
    name: "The database answers",
    run: async () => {
      if (!process.env.DATABASE_URL) throw new Error("There is no DATABASE_URL to try.");
      const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 });
      try {
        await client.connect();
        await client.query("select 1");
        return "the database answered";
      } catch (error) {
        throw new Error(describeDbError(error));
      } finally {
        await client.end().catch(() => {});
      }
    },
  },
];

if (args.includes("--list")) {
  console.log(JSON.stringify({ phase1: phase1.map((c) => c.name), phase2: phase2.map((c) => c.name) }));
  process.exit(0);
}

async function runPhase(label, checks) {
  let failed = 0;
  for (const check of checks) {
    try {
      const detail = await check.run();
      console.log(`  ok       ${check.name}: ${detail}`);
    } catch (error) {
      failed += 1;
      console.log(`  MISSING  ${check.name}: ${error.message}`);
    }
  }
  if (failed === 0) {
    console.log(`${label} passed after ${checks.length} checks.`);
  } else {
    console.log(`${label} is not finished: ${failed} of ${checks.length} checks need a fix.`);
  }
  return failed === 0;
}

console.log("Phase 1: Node, Git and the build");
const ok1 = await runPhase("Phase 1", phase1);
let ok2 = true;
if (wantPhase2) {
  console.log("\nPhase 2: environment variables and the database");
  ok2 = await runPhase("Phase 2", phase2);
}
process.exit(ok1 && ok2 ? 0 : 1);
