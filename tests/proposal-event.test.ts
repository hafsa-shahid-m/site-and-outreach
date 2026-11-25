import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST } from "../app/api/proposal-event/route";
import { setDbForTests } from "../lib/db";
import { createSession } from "../lib/session";
import { clear, HUMAN_UA, makeDb, need, why } from "./helpers/db";

let db: Awaited<ReturnType<typeof makeDb>>;
beforeAll(async () => {
  db = await makeDb();
  setDbForTests(db);
});
afterAll(() => setDbForTests(undefined));
beforeEach(async () => {
  await need(db, "proposal_visits", "5.6", "part 1");
  await clear(db, ["proposal_visits", "recipients", "proposals", "dropped"]);
  await db.query("insert into proposals (slug, title) values ('demo', 'Demo')");
  await db.query("insert into recipients (proposal_id, name, token) values (1, 'Test person', 'tok0000000000000000001')");
});

const send = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request("http://localhost:3000/api/proposal-event", {
      method: "POST",
      headers: { "user-agent": HUMAN_UA, "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
const visit = async (key: string) => (await db.query("select * from proposal_visits where visit_key = $1", [key])).rows[0];
const addVisit = (key: string) => db.query("insert into proposal_visits (visit_key, recipient_id) values ($1, 1)", [key]);
const opened = (key: string, extra: object = {}) => ({ visit_key: key, kind: "opened", jsRan: true, visibleSeconds: 4, actions: 1, ...extra });

describe("the opened event (chapter 5.6)", () => {
  it("sets opened_at once for a person who passed the open rule", async () => {
    await addVisit("key-person");
    expect((await send(opened("key-person"))).status).toBe(204);
    const first = (await visit("key-person")).opened_at;
    expect(first, why("5.6", "set opened_at when isOpened says yes")).not.toBeNull();
    await send(opened("key-person", { visibleSeconds: 40 }));
    expect((await visit("key-person")).opened_at.getTime(), "opened is set once per visit").toBe(first.getTime());
  });

  it("does not open for a visit with no human action", async () => {
    await addVisit("key-scanner");
    await send(opened("key-scanner", { actions: 0 }));
    expect((await visit("key-scanner")).opened_at).toBeNull();
  });

  it("does not open when the page's JavaScript did not report", async () => {
    await addVisit("key-nojs");
    await send(opened("key-nojs", { jsRan: false }));
    expect((await visit("key-nojs")).opened_at).toBeNull();
  });

  it("answers 204 and writes nothing for an unknown key", async () => {
    await addVisit("key-real");
    expect((await send(opened("nope"))).status).toBe(204);
    expect((await visit("key-real")).opened_at).toBeNull();
  });

  it("a robot fetch between the person's load and open does not take the open", async () => {
    await addVisit("key-person-first");
    await addVisit("key-robot-second");
    await send(opened("key-person-first"));
    const rows = (await db.query("select visit_key, opened_at from proposal_visits order by id")).rows;
    const got = rows.find((r) => r.opened_at)?.visit_key;
    expect(got, why("5.6", `the open went to the visit "${got}". Find the visit by its visit_key, not as the newest row.`)).toBe("key-person-first");
  });

  it("ignores the owner", async () => {
    await need(db, "sessions", "4.10");
    const session = await createSession();
    await addVisit("key-owner");
    await send(opened("key-owner"), { cookie: `session=${session.id}` });
    expect((await visit("key-owner")).opened_at, why("5.6", "the owner is never counted")).toBeNull();
  });

  it("answers 204 for a body that is not JSON", async () => {
    expect((await send("not json")).status).toBe(204);
  });
});

describe("the heartbeat event (chapter 5.8)", () => {
  const beat = (key: string, seconds: number, sections: string[]) => ({ visit_key: key, kind: "heartbeat", visibleSeconds: seconds, sections });

  it("is ignored for a visit that was never opened", async () => {
    await addVisit("key-closed");
    expect((await send(beat("key-closed", 30, ["fit"]))).status).toBe(204);
    const row = await visit("key-closed");
    expect(row.visible_seconds, why("5.8", "a heartbeat before an open writes nothing")).toBe(0);
    expect(row.sections_seen).toEqual([]);
  });

  it("keeps the larger seconds and the union of sections, so an older heartbeat does no harm", async () => {
    await addVisit("key-read");
    await send(opened("key-read"));
    await send(beat("key-read", 30, ["fit", "ask"]));
    await send(beat("key-read", 5, []));
    await send(beat("key-read", 40, ["trade-offs", "fit"]));
    const row = await visit("key-read");
    expect(row.visible_seconds, why("5.8", "run the merge as written: greatest keeps the larger number")).toBe(40);
    expect([...row.sections_seen].sort()).toEqual(["ask", "fit", "trade-offs"]);
  });

  it("rejects quietly a body with bad values", async () => {
    await addVisit("key-bad");
    await send(opened("key-bad"));
    for (const body of [
      beat("key-bad", -5, []),
      beat("key-bad", 1.5, []),
      { visit_key: "key-bad", kind: "heartbeat", visibleSeconds: 9, sections: "fit" },
      { visit_key: "key-bad", kind: "heartbeat", visibleSeconds: 9, sections: [1, 2] },
      { kind: "heartbeat", visibleSeconds: 9, sections: [] },
    ]) {
      expect((await send(body)).status).toBe(204);
    }
    expect((await visit("key-bad")).visible_seconds).toBe(4);
  });

  it("ignores the owner", async () => {
    await need(db, "sessions", "4.10");
    const session = await createSession();
    await addVisit("key-owner2");
    await send(opened("key-owner2"));
    await send(beat("key-owner2", 99, ["fit"]), { cookie: `session=${session.id}` });
    expect((await visit("key-owner2")).visible_seconds).toBe(4);
  });
});
