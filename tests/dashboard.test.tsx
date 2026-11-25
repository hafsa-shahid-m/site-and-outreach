import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { setDbForTests } from "../lib/db";
import { createSession } from "../lib/session";
import { loadSeed, makeDb, need, why } from "./helpers/db";

let cookieValue: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "session" && cookieValue ? { value: cookieValue } : undefined) }),
}));

import Dashboard from "../app/dashboard/page";

let db: Awaited<ReturnType<typeof makeDb>>;
beforeAll(async () => {
  db = await makeDb();
  setDbForTests(db);
  for (const lab of ["lab2", "lab3", "lab4"] as const) await loadSeed(db, lab);
});
afterAll(() => setDbForTests(undefined));

async function page(): Promise<string> {
  return renderToStaticMarkup(await Dashboard());
}
async function login() {
  await need(db, "sessions", "4.10");
  cookieValue = (await createSession()).id;
}

describe("the dashboard door (chapter 4.10)", () => {
  it("sends you to /login without a session", async () => {
    cookieValue = undefined;
    await expect(page(), why("4.10", "without a valid session, redirect to /login")).rejects.toMatchObject({
      digest: expect.stringContaining("/login"),
    });
  });

  it("sends you to /login for a made-up cookie", async () => {
    cookieValue = "owner";
    await expect(page()).rejects.toMatchObject({ digest: expect.stringContaining("/login") });
  });
});

describe("the dashboard panels", () => {
  it("shows the four first panels, the range and the visitor-days note (chapter 4.11)", async () => {
    await login();
    const html = await page();
    for (const id of ["views-per-day", "visitors-per-day", "top-pages", "referrers"]) {
      expect(html, why("4.11", `show the "${id}" panel`)).toContain(`data-panel="${id}"`);
    }
    expect(html, why("4.11", "say what the range is and that the visitors total is visitor-days")).toMatch(/visitor-days/);
    expect(html).toMatch(/UTC/);
  });

  it("shows the proposal status panel (chapter 5.9)", async () => {
    await login();
    expect(await page(), why("5.9", "show the proposals panel")).toContain('data-panel="proposals"');
  });

  it("lays out the four traffic panels, including blog reads (chapter 6.7)", async () => {
    await login();
    const html = await page();
    expect(html, why("6.7", "lay out the traffic panels")).toContain('data-panel="traffic"');
    expect(html).toContain('data-panel="blog-reads"');
  });

  it("lays out the outreach panels and the filtered share tile (chapter 6.8)", async () => {
    await login();
    const html = await page();
    for (const id of ["clicks", "funnel", "filtered-share"]) {
      expect(html, why("6.8", `place the "${id}" panel`)).toContain(`data-panel="${id}"`);
    }
  });

  it("shows the reach-out form to the owner (chapter 6.4)", async () => {
    await login();
    expect(await page(), why("6.4", "add ReachoutForm to the dashboard")).toContain("reachout-form");
  });
});
