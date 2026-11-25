import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../app/go/[slug]/route";
import { settled } from "../lib/after";
import { setDbForTests } from "../lib/db";
import { createSession } from "../lib/session";
import { links } from "../links";
import { clear, HUMAN_UA, makeDb, need, why } from "./helpers/db";

let db: Awaited<ReturnType<typeof makeDb>>;
const slug = Object.keys(links)[0];

beforeAll(async () => {
  db = await makeDb();
  setDbForTests(db);
});
afterAll(() => setDbForTests(undefined));
beforeEach(async () => {
  await need(db, "clicks", "6.3", "part 1");
  await clear(db, ["clicks", "dropped", "reachouts", "recipients", "proposals"]);
});

async function go(path: string, headers: Record<string, string> = { "user-agent": HUMAN_UA }, method = "GET") {
  const response = await GET(new NextRequest(`http://localhost:3000${path}`, { method, headers }), {
    params: Promise.resolve({ slug: path.split("/")[2].split("?")[0] }),
  });
  await settled();
  return response;
}
const count = async (sql = "select count(*)::int as n from clicks") => (await db.query(sql)).rows[0].n as number;

describe("tracked links (chapter 6.3)", () => {
  it("answers 307, never 308, with the target from links.ts", async () => {
    const response = await go(`/go/${slug}`);
    expect(response.status, why("6.3", "the redirect must be 307: a permanent 308 is remembered by the browser (chapter 6.2)")).toBe(307);
    expect(response.headers.get("location")).toBe(links[slug]);
  });

  it("sends Cache-Control: no-store so every tap reaches the server", async () => {
    const response = await go(`/go/${slug}`);
    expect(response.headers.get("cache-control"), why("6.3", "add Cache-Control: no-store to the redirect (chapter 6.2)")).toBe("no-store");
  });

  it("answers 404 for an unknown slug, with a link home", async () => {
    const response = await go("/go/not-a-link");
    expect(response.status, why("6.3", "unknown slug answers 404")).toBe(404);
    expect(await response.text()).toContain('href="/"');
    expect(await count()).toBe(0);
  });

  it("never reads the target from the query string", async () => {
    const response = await go(`/go/${slug}?to=https://evil.example&url=https://evil.example`);
    expect(response.headers.get("location"), why("6.3", "target is never read from the query string")).toBe(links[slug]);
  });

  it("records one click for a person", async () => {
    await go(`/go/${slug}`);
    expect(await count(), why("6.3", "record one click after the response, for a person")).toBe(1);
    expect(await count("select count(*)::int as n from clicks where slug = '" + slug + "'")).toBe(1);
  });

  it("drops a robot: still redirected, no click, one dropped row", async () => {
    const response = await go(`/go/${slug}`, { "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" });
    expect(response.status).toBe(307);
    expect(await count(), why("6.3", "call classify once and record no click for a robot")).toBe(0);
    expect((await db.query("select surface, reason from dropped")).rows).toEqual([{ surface: "click", reason: "robot" }]);
  });

  it("drops a prefetch and a HEAD request", async () => {
    await go(`/go/${slug}`, { "user-agent": HUMAN_UA, "sec-purpose": "prefetch" });
    await go(`/go/${slug}`, { "user-agent": HUMAN_UA }, "HEAD");
    expect(await count()).toBe(0);
    const reasons = (await db.query("select reason from dropped order by id")).rows.map((r) => r.reason);
    expect(reasons).toEqual(["prefetch", "head"]);
  });

  it("drops the owner, with the reason owner", async () => {
    await need(db, "sessions", "4.10");
    const session = await createSession();
    const response = await go(`/go/${slug}`, { "user-agent": HUMAN_UA, cookie: `session=${session.id}` });
    expect(response.status).toBe(307);
    expect(await count()).toBe(0);
    expect((await db.query("select reason from dropped")).rows).toEqual([{ reason: "owner" }]);
  });

  it("keeps the recipient when ?r= is a known token, and ignores an unknown one", async () => {
    await need(db, "recipients", "5.4", "part 2");
    await db.query("insert into proposals (slug, title) values ('demo', 'Demo')");
    await db.query("insert into recipients (proposal_id, name, token) values (1, 'Test', 'tok-known-0000000000000')");
    await go(`/go/${slug}?r=tok-known-0000000000000`);
    await go(`/go/${slug}?r=made-up`);
    const rows = (await db.query("select recipient_id from clicks order by id")).rows;
    expect(rows.map((r) => (r.recipient_id === null ? null : Number(r.recipient_id))), why("6.3", "keep the recipient only for a known token")).toEqual([1, null]);
  });

  it("still redirects when the database is down, with one log line", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    setDbForTests({
      query: async () => {
        throw Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" });
      },
    });
    try {
      const response = await go(`/go/${slug}?r=abc`);
      expect(response.status, why("6.3", "the redirect must not wait for the database")).toBe(307);
      expect(log).toHaveBeenCalledTimes(1);
    } finally {
      setDbForTests(db);
      log.mockRestore();
    }
  });
});
