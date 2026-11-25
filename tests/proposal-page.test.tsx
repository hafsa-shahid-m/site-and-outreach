import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { settled } from "../lib/after";
import { setDbForTests } from "../lib/db";
import { createSession } from "../lib/session";
import { clear, HUMAN_UA, makeDb, need, why } from "./helpers/db";

let currentHeaders = new Headers();
vi.mock("next/headers", () => ({ headers: async () => currentHeaders }));

import ProposalPage, { metadata } from "../app/p/[token]/page";
import DemoProposal from "../app/p/demo/page";

let db: Awaited<ReturnType<typeof makeDb>>;
const TOKEN = "tok0000000000000000001";

beforeAll(async () => {
  db = await makeDb();
  setDbForTests(db);
});
afterAll(() => setDbForTests(undefined));
beforeEach(async () => {
  await need(db, "recipients", "5.4", "part 2");
  await need(db, "proposal_visits", "5.6", "part 1");
  await clear(db, ["proposal_visits", "recipients", "proposals", "dropped"]);
  await db.query("insert into proposals (slug, title) values ('demo', 'Demo')");
  await db.query("insert into recipients (proposal_id, name, token) values (1, 'Test person', $1)", [TOKEN]);
  currentHeaders = new Headers({ "user-agent": HUMAN_UA });
});

const render = async (token = TOKEN) =>
  renderToStaticMarkup(await ProposalPage({ params: Promise.resolve({ token }) }));
const visits = async () => (await db.query("select * from proposal_visits")).rows;

describe("the proposal page (chapter 5.4)", () => {
  it("shows a 404 for an unknown token", async () => {
    await expect(render("tok-not-made-by-me-000"), why("5.4", "an unknown token must call notFound()")).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });

  it("is not indexed and sends no referrer", () => {
    expect(JSON.stringify(metadata), why("5.4", "set robots to noindex and referrer to no-referrer")).toContain('"index":false');
    expect((metadata as { referrer?: string }).referrer).toBe("no-referrer");
  });

  it("shows the recording note and gives every section an id", async () => {
    const html = await render();
    expect(html).toContain("data-recording-note");
    for (const id of ["ask", "reason", "fit", "trade-offs"]) expect(html).toContain(`id="${id}"`);
  });

  it("rewrites each tracked link to carry the recipient token", async () => {
    const html = await render();
    expect(html, why("5.4", "render each tracked link as /go/<slug>?r=<token>")).toContain(`href="/go/example-project?r=${TOKEN}"`);
  });

  it("the demo page records nothing and shows the note", async () => {
    const html = renderToStaticMarkup(DemoProposal());
    expect(html, why("5.4", "the demo page shows the proposal and the recording note")).toContain("data-recording-note");
    await settled();
    expect(await visits()).toHaveLength(0);
  });
});

describe("recording a fetch (chapter 5.6)", () => {
  it("records one fetched row with a visit key, after the response", async () => {
    await render();
    await settled();
    const rows = await visits();
    expect(rows, why("5.6", "record one fetched row per real fetch")).toHaveLength(1);
    expect(rows[0].visit_key).toHaveLength(22);
    expect(rows[0].opened_at).toBeNull();
  });

  it("keeps a robot's fetch as a fetched visit that is never opened", async () => {
    currentHeaders = new Headers({ "user-agent": "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)" });
    await render();
    await settled();
    const rows = await visits();
    expect(rows, why("5.6", "a robot's fetch is still a fetch")).toHaveLength(1);
    expect(rows[0].opened_at).toBeNull();
  });

  it("counts a client-side navigation as a fetch", async () => {
    currentHeaders = new Headers({ "user-agent": HUMAN_UA, rsc: "1" });
    await render();
    await settled();
    expect(await visits()).toHaveLength(1);
  });

  it("leaves no visit for a prefetch, only one dropped row", async () => {
    currentHeaders = new Headers({ "user-agent": HUMAN_UA, "sec-purpose": "prefetch" });
    await render();
    await settled();
    expect(await visits(), why("5.6", "a prefetch is not a fetch")).toHaveLength(0);
    expect((await db.query("select surface, reason from dropped")).rows).toEqual([{ surface: "proposal", reason: "prefetch" }]);
  });

  it("leaves no visit for the owner, only one dropped row", async () => {
    await need(db, "sessions", "4.10");
    const session = await createSession();
    currentHeaders = new Headers({ "user-agent": HUMAN_UA, cookie: `session=${session.id}` });
    await render();
    await settled();
    expect(await visits()).toHaveLength(0);
    expect((await db.query("select surface, reason from dropped")).rows).toEqual([{ surface: "proposal", reason: "owner" }]);
  });

  it("throws, so error.tsx can answer, when the database is down", async () => {
    setDbForTests({
      query: async () => {
        throw new Error("connect ECONNREFUSED");
      },
    });
    try {
      await expect(render(), why("5.4", "do not catch a database error in the page")).rejects.toThrow("ECONNREFUSED");
    } finally {
      setDbForTests(db);
    }
  });
});
