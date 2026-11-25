import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/view/route";
import { setDbForTests } from "../lib/db";
import { clear, HUMAN_UA, makeDb, need, post, why } from "./helpers/db";

let db: Awaited<ReturnType<typeof makeDb>>;

beforeAll(async () => {
  db = await makeDb();
  setDbForTests(db);
});
afterAll(() => setDbForTests(undefined));
beforeEach(async () => {
  await need(db, "views", "4.4", "part 2");
  await clear(db, ["views", "dropped"]);
});

const URL_ = "http://localhost:3000/api/view";

describe("the view handler (chapter 4.5)", () => {
  it("stores one view for a normal visit", async () => {
    const response = await POST(post(URL_, { path: "/about", referrer: "https://www.linkedin.com/feed/" }));
    expect(response.status).toBe(204);
    const rows = (await db.query("select path, referrer_host, visitor, device from views")).rows;
    expect(rows, why("4.5", "the handler stored no row for a normal visit")).toHaveLength(1);
    expect(rows[0].path).toBe("/about");
    expect(rows[0].referrer_host, "the host only, without www").toBe("linkedin.com");
    expect(rows[0].visitor).toHaveLength(16);
    expect(rows[0].device).toBe("desktop");
  });

  it("accepts application/json and text/plain", async () => {
    await POST(post(URL_, { path: "/a" }, { "content-type": "application/json" }));
    await POST(post(URL_, { path: "/b" }, { "content-type": "text/plain" }));
    const rows = (await db.query("select path from views order by path")).rows;
    expect(rows.map((r) => r.path), why("4.5", "both content types must be read")).toEqual(["/a", "/b"]);
  });

  it("answers 204 and stores nothing for a body that is not JSON", async () => {
    const response = await POST(post(URL_, "not json"));
    expect(response.status).toBe(204);
    expect((await db.query("select count(*)::int as n from views")).rows[0].n).toBe(0);
  });

  it("never stores a proposal page path, because it holds a recipient token", async () => {
    await POST(post(URL_, { path: "/p/abcdefghijklmnopqrstuv" }));
    expect((await db.query("select count(*)::int as n from views")).rows[0].n).toBe(0);
  });

  it("stores no address and no full browser string", async () => {
    await POST(post(URL_, { path: "/", referrer: "https://example.org/secret/path?x=1" }));
    const row = (await db.query("select * from views")).rows[0];
    const text = JSON.stringify(row);
    expect(text).not.toContain("secret/path");
    expect(text).not.toContain("Mozilla");
    expect(text).not.toContain("0.0.0.0");
  });

  it("still answers 204 when the database is down, with one log line", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    setDbForTests({
      query: async () => {
        throw Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" });
      },
    });
    try {
      const response = await POST(post(URL_, { path: "/" }, { "user-agent": HUMAN_UA }));
      expect(response.status, why("4.5", "a database error must never reach the visitor")).toBe(204);
      expect(log, why("4.5", "write through safeWrite so a failure is one log line")).toHaveBeenCalledTimes(1);
    } finally {
      setDbForTests(db);
      log.mockRestore();
    }
  });
});
