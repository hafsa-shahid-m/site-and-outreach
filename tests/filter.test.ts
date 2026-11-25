import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as viewRoute } from "../app/api/view/route";
import { setDbForTests } from "../lib/db";
import { classify } from "../lib/filter";
import { checkSecret, createSession } from "../lib/session";
import fixture from "./fixtures/requests.json";
import { clear, HUMAN_UA, makeDb, need, post, why } from "./helpers/db";

type Case = { name: string; method?: string; headers: Record<string, string>; expect: string };
const cases = fixture as Case[];

// The owner test needs the login from chapter 4.10. Until you write it, this test is skipped.
function loginIsWritten(): boolean {
  try {
    checkSecret("x");
    return true;
  } catch (error) {
    return !/not written yet/.test((error as Error).message);
  }
}

let db: Awaited<ReturnType<typeof makeDb>>;
beforeAll(async () => {
  db = await makeDb();
  setDbForTests(db);
});
afterAll(() => setDbForTests(undefined));

function toRequest(c: Case) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(c.headers)) headers.set(k, v);
  return { headers, method: c.method };
}

describe("classify (chapter 4.7)", () => {
  const kinds: [string, (c: Case) => boolean][] = [
    ["counts every normal browser as a person", (c) => c.expect === "person"],
    ["drops every robot, preview robot and script (reason robot)", (c) => c.expect === "robot"],
    ["drops an empty or missing browser string (reason empty-agent)", (c) => c.expect === "empty-agent"],
    ["drops prefetches (reason prefetch)", (c) => c.expect === "prefetch" && !c.name.startsWith("two causes")],
    ["drops a HEAD request (reason head)", (c) => c.expect === "head" && !c.name.startsWith("two causes")],
    ["with two causes, the first in the order is the reason", (c) => c.name.startsWith("two causes")],
  ];
  for (const [title, pick] of kinds) {
    it(title, async () => {
      const wrong: string[] = [];
      for (const c of cases.filter(pick)) {
        const verdict = await classify(toRequest(c));
        const got = verdict.person ? "person" : verdict.reason;
        if (got !== c.expect) wrong.push(`"${c.name}" should be ${c.expect}, got ${got}`);
      }
      expect(wrong, why("4.7", `${wrong.length} request(s) were classified wrongly`)).toEqual([]);
    });
  }

  it("counts the whole fixture", async () => {
    const letThrough: string[] = [];
    let people = 0;
    for (const c of cases) {
      const verdict = await classify(toRequest(c));
      if (verdict.person) people += 1;
      if (verdict.person && c.expect === "robot") letThrough.push(c.headers["user-agent"]);
    }
    const expected = cases.filter((c) => c.expect === "person").length;
    console.log(`people: ${people} of ${cases.length}`);
    expect(
      people,
      why("4.7", `${letThrough.length} robot strings got through. The first three: ${letThrough.slice(0, 3).join(" | ")}. Use the isbot package.`),
    ).toBe(expected);
  });

  it.skipIf(!loginIsWritten())("drops the owner when the session cookie is a real session", async () => {
    await need(db, "sessions", "4.10");
    const session = await createSession();
    const headers = new Headers({ "user-agent": HUMAN_UA, cookie: `session=${session.id}` });
    expect(await classify({ headers })).toEqual({ person: false, reason: "owner" });
  });
});

describe("the view route asks classify (chapter 4.7)", () => {
  beforeEach(async () => {
    await need(db, "views", "4.4", "part 2");
    await clear(db, ["views", "dropped"]);
  });

  it("drops a robot: no view, one dropped row", async () => {
    const googlebot = "Googlebot/2.1 (+http://www.google.com/bot.html)";
    const response = await viewRoute(post("http://localhost:3000/api/view", { path: "/bot" }, { "user-agent": googlebot }));
    expect(response.status).toBe(204);
    expect((await db.query("select count(*)::int as n from views")).rows[0].n, why("4.7", "a robot made a view")).toBe(0);
    const dropped = (await db.query("select surface, reason from dropped")).rows;
    expect(dropped, why("4.7", "call recordDropped('view', reason) when classify says not a person")).toEqual([
      { surface: "view", reason: "robot" },
    ]);
  });

  it("with two causes, the first in the order is the reason", async () => {
    await viewRoute(
      post("http://localhost:3000/api/view", { path: "/two" }, { "user-agent": "Googlebot/2.1", "sec-purpose": "prefetch" }),
    );
    const dropped = (await db.query("select reason from dropped")).rows;
    expect(dropped, why("4.7", "prefetch comes before robot in the order")).toEqual([{ reason: "prefetch" }]);
  });

  it("counts a person with a normal browser string", async () => {
    await viewRoute(post("http://localhost:3000/api/view", { path: "/human" }, { "user-agent": HUMAN_UA }));
    expect((await db.query("select count(*)::int as n from views where path = '/human'")).rows[0].n).toBe(1);
  });
});
