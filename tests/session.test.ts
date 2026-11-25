import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as loginRoute } from "../app/api/login/route";
import { setDbForTests } from "../lib/db";
import { checkSecret, createSession, readSession } from "../lib/session";
import { clear, makeDb, need, why } from "./helpers/db";

let db: Awaited<ReturnType<typeof makeDb>>;
beforeAll(async () => {
  db = await makeDb();
  setDbForTests(db);
});
afterAll(() => setDbForTests(undefined));
beforeEach(async () => {
  await need(db, "sessions", "4.10");
  await clear(db, ["sessions"]);
});

describe("the secret check (chapter 4.10)", () => {
  it("accepts the right secret", () => {
    expect(checkSecret("owner-secret-for-the-unit-tests")).toBe(true);
  });
  it("refuses a wrong secret", () => {
    expect(checkSecret("wrong")).toBe(false);
  });
  it("does not throw for a secret of another length, or an empty one", () => {
    expect(() => checkSecret("")).not.toThrow();
    expect(() => checkSecret("x".repeat(500))).not.toThrow();
    expect(checkSecret("x".repeat(500))).toBe(false);
  });
  it("refuses everything when OWNER_SECRET is not set", () => {
    const saved = process.env.OWNER_SECRET;
    delete process.env.OWNER_SECRET;
    try {
      expect(checkSecret("")).toBe(false);
      expect(checkSecret("undefined")).toBe(false);
    } finally {
      process.env.OWNER_SECRET = saved;
    }
  });
});

describe("create and read sessions (chapter 4.10)", () => {
  it("makes a random id of 32 bytes and stores it", async () => {
    const a = await createSession();
    const b = await createSession();
    expect(a.id, why("4.10", "32 random bytes written in base64url are 43 characters")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a.id).not.toBe(b.id);
    expect((await db.query("select count(*)::int as n from sessions")).rows[0].n).toBe(2);
  });

  it("expires in about 30 days", async () => {
    const session = await createSession();
    const days = (new Date(session.expires_at).getTime() - Date.now()) / 86400000;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThan(30.1);
  });

  it("reads a session that is in the table", async () => {
    const session = await createSession();
    expect(await readSession(session.id)).not.toBeNull();
  });

  it("does not read a made-up cookie", async () => {
    expect(await readSession("owner"), why("4.10", "a cookie that is present is not a cookie that is in the table")).toBeNull();
    expect(await readSession("true")).toBeNull();
    expect(await readSession(undefined)).toBeNull();
  });

  it("does not read an expired session", async () => {
    await db.query("insert into sessions (id, expires_at) values ('old', now() - interval '1 minute')");
    expect(await readSession("old")).toBeNull();
  });
});

describe("the login route (chapter 4.10)", () => {
  const login = (secret: string) =>
    loginRoute(
      new Request("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ secret }),
      }),
    );

  it("answers 401 and sets no cookie for a wrong secret", async () => {
    const response = await login("wrong");
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect((await db.query("select count(*)::int as n from sessions")).rows[0].n).toBe(0);
  });

  it("sets an HttpOnly, Secure, SameSite cookie for the right secret, and stores the session", async () => {
    const response = await login("owner-secret-for-the-unit-tests");
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^session=[A-Za-z0-9_-]{43};/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    const id = cookie.split(";")[0].split("=")[1];
    expect(await readSession(id)).not.toBeNull();
  });
});
