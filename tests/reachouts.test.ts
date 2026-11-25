import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST } from "../app/api/reachouts/route";
import { setDbForTests } from "../lib/db";
import { validateReachout } from "../lib/reachouts";
import { createSession } from "../lib/session";
import { clear, makeDb, need, why } from "./helpers/db";

let db: Awaited<ReturnType<typeof makeDb>>;
beforeAll(async () => {
  db = await makeDb();
  setDbForTests(db);
});
afterAll(() => setDbForTests(undefined));
beforeEach(async () => {
  await need(db, "reachouts", "6.4", "part 1");
  await clear(db, ["reachouts", "recipients", "proposals"]);
  await db.query("insert into proposals (slug, title) values ('demo', 'Demo')");
  await db.query("insert into recipients (proposal_id, name, token) values (1, 'Test person', 'tok0000000000000000001')");
});

describe("validateReachout (chapter 6.4)", () => {
  it("accepts a known recipient, a channel and a note", async () => {
    const result = await validateReachout(db, { recipientId: 1, channel: "email", note: "hello" });
    expect(result).toEqual({ ok: true, value: { recipientId: 1, channel: "email", note: "hello" } });
  });
  it("makes the note optional", async () => {
    const result = await validateReachout(db, { recipientId: 1, channel: "linkedin" });
    expect(result.ok).toBe(true);
  });
  it("refuses a recipient that does not exist", async () => {
    const result = await validateReachout(db, { recipientId: 999, channel: "email" });
    expect(result.ok, why("6.4", "check that the recipient exists before you insert")).toBe(false);
  });
  it("refuses a channel that is not one of the four", async () => {
    const result = await validateReachout(db, { recipientId: 1, channel: "carrier pigeon" });
    expect(result.ok, why("6.4", "channel must be linkedin, email, whatsapp or other")).toBe(false);
  });
  it("refuses a note over 500 characters", async () => {
    const result = await validateReachout(db, { recipientId: 1, channel: "other", note: "x".repeat(501) });
    expect(result.ok).toBe(false);
    expect((await validateReachout(db, { recipientId: 1, channel: "other", note: "x".repeat(500) })).ok).toBe(true);
  });
});

describe("the reach-outs route (chapter 6.4)", () => {
  const call = (body: unknown, cookie?: string) =>
    POST(
      new NextRequest("http://localhost:3000/api/reachouts", {
        method: "POST",
        headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
        body: JSON.stringify(body),
      }),
    );

  it("answers 401 without a session and stores nothing", async () => {
    const response = await call({ recipientId: 1, channel: "email" });
    expect(response.status, why("6.4", "only the owner may log a reach-out")).toBe(401);
    expect((await db.query("select count(*)::int as n from reachouts")).rows[0].n).toBe(0);
  });

  it("answers 400 with a clear message for bad input", async () => {
    await need(db, "sessions", "4.10");
    const session = await createSession();
    const response = await call({ recipientId: 999, channel: "email" }, `session=${session.id}`);
    expect(response.status, why("6.4", "bad input is a 400 the owner can read, not a database error")).toBe(400);
    expect((await response.json()).error).toBeTruthy();
  });

  it("answers 201 and stores one row", async () => {
    await need(db, "sessions", "4.10");
    const session = await createSession();
    const response = await call({ recipientId: 1, channel: "whatsapp", note: "sent" }, `session=${session.id}`);
    expect(response.status).toBe(201);
    const rows = (await db.query("select recipient_id, channel, note from reachouts")).rows;
    expect(rows.map((r) => ({ ...r, recipient_id: Number(r.recipient_id) }))).toEqual([{ recipient_id: 1, channel: "whatsapp", note: "sent" }]);
  });
});
