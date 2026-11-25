import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET } from "../app/api/stats/[panel]/route";
import { setDbForTests } from "../lib/db";
import { createSession } from "../lib/session";
import { loadSeed, makeDb, need, seedWeek, why } from "./helpers/db";

let db: Awaited<ReturnType<typeof makeDb>>;
let week: { from: string; to: string };

beforeAll(async () => {
  db = await makeDb();
  setDbForTests(db);
  week = await seedWeek(db);
  for (const lab of ["lab2", "lab3", "lab4"] as const) await loadSeed(db, lab);
});
afterAll(() => setDbForTests(undefined));

const call = (panel: string, cookie?: string, query = "") =>
  GET(
    new NextRequest(`http://localhost:3000/api/stats/${panel}${query}`, cookie ? { headers: { cookie } } : undefined),
    { params: Promise.resolve({ panel }) },
  );

const ROUTES: [string, string][] = [
  ["views-per-day", "4.11"],
  ["visitors-per-day", "4.11"],
  ["top-pages", "4.11"],
  ["referrers", "4.11"],
  ["proposals", "5.9"],
  ["blog-reads", "6.7"],
  ["clicks", "6.8"],
  ["funnel", "6.8"],
  ["filtered-share", "6.8"],
];

describe("the data routes: the door (chapter 4.10)", () => {
  it("answer 401 with no cookie", async () => {
    expect((await call("top-pages")).status, why("4.10", "check the session before any data")).toBe(401);
  });
  it("answer 401 for a made-up cookie", async () => {
    expect((await call("top-pages", "session=owner")).status, why("4.10", "a cookie must be a row in sessions")).toBe(401);
    expect((await call("top-pages", "session=true")).status).toBe(401);
  });
  it("answer 401 for every panel without a session", async () => {
    for (const [panel] of ROUTES) expect((await call(panel)).status, `${panel} must answer 401`).toBe(401);
  });
});

describe("the data routes: the panels", () => {
  for (const [panel, chapter] of ROUTES) {
    it(`/api/stats/${panel} answers 200 with a session (chapter ${chapter})`, async () => {
      await need(db, "sessions", "4.10");
      const session = await createSession();
      const response = await call(panel, `session=${session.id}`, `?from=${week.from}&to=${week.to}`);
      expect(response.status, why(chapter, `the route "${panel}" is not in your panel router yet`)).toBe(200);
      expect(await response.json()).toBeTruthy();
    });
  }

  it("returns the top page first, as plain JSON", async () => {
    await need(db, "sessions", "4.10");
    const session = await createSession();
    const rows = await (await call("top-pages", `session=${session.id}`, `?from=${week.from}&to=${week.to}`)).json();
    expect(rows[0].path).toBe("/");
  });

  it("answers 404 for a panel that does not exist", async () => {
    await need(db, "sessions", "4.10");
    const session = await createSession();
    expect((await call("nope", `session=${session.id}`)).status).toBe(404);
  });
});
