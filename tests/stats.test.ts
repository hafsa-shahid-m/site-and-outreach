import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { setDbForTests } from "../lib/db";
import * as stats from "../lib/stats";
import expected from "./fixtures/seed-expected.json";
import { loadSeed, makeDb, need, seedWeek, why } from "./helpers/db";

let db: Awaited<ReturnType<typeof makeDb>>;
let week: { from: string; to: string; day3: string };

beforeAll(async () => {
  db = await makeDb();
  setDbForTests(db);
  week = await seedWeek(db);
  for (const lab of ["lab2", "lab3", "lab4"] as const) await loadSeed(db, lab);
});
afterAll(() => setDbForTests(undefined));

describe("views and visitors per day (chapter 4.11)", () => {
  it("gives one row for each of the seven seed days, with the known views", async () => {
    await need(db, "views", "4.4", "part 2");
    const rows = await stats.viewsPerDay(db, week);
    expect(rows.map((r) => r.views), why("4.11", "views per day over the seed week")).toEqual(expected.seed_views_per_day);
  });

  it("counts day 3 views and visitors differently", async () => {
    await need(db, "views", "4.4", "part 2");
    const views = (await stats.viewsPerDay(db, week))[2];
    const visitors = (await stats.visitorsPerDay(db, week))[2];
    expect(views.views).toBe(expected.seed_views_day3);
    expect(
      visitors.visitors,
      why("4.11", `expected ${expected.seed_unique_visitors_day3} visitors on day 3 and got ${visitors.visitors}. One hash comes back several times on that day, so count distinct visitors.`),
    ).toBe(expected.seed_unique_visitors_day3);
  });
});

describe("top pages and referrers (chapter 4.11)", () => {
  it("puts the known page first", async () => {
    await need(db, "views", "4.4", "part 2");
    const rows = await stats.topPages(db, week);
    expect(rows[0], why("4.11", "top page over the seed week")).toEqual({ path: expected.seed_top_page, views: expected.seed_top_page_views });
  });

  it("puts the known referrer first and writes no referrer as direct", async () => {
    await need(db, "views", "4.4", "part 2");
    const rows = await stats.referrers(db, week);
    expect(rows[0].referrer, why("4.11", "top referrer over the seed week")).toBe(expected.seed_top_referrer);
    expect(rows.map((r) => r.referrer)).toContain("direct");
    expect(rows.map((r) => r.referrer)).not.toContain(null);
  });

  it("ignores views outside the range", async () => {
    await need(db, "views", "4.4", "part 2");
    const rows = await stats.topPages(db, { from: "2001-01-01", to: "2001-01-07" });
    expect(rows).toEqual([]);
  });
});

describe("proposal status (chapter 5.9)", () => {
  it("has one row for every recipient, even one with no visit", async () => {
    await need(db, "recipients", "5.4", "part 2");
    await need(db, "proposal_visits", "5.6", "part 1");
    const rows = await stats.proposalStatus(db, week);
    expect(
      rows.length,
      why("5.9", `expected ${expected.seed_recipient_count} rows and got ${rows.length}. Recipients with no visit vanish with an inner join. Use a left join.`),
    ).toBe(expected.seed_recipient_count);
  });

  it("shows the recipient who was only fetched", async () => {
    await need(db, "proposal_visits", "5.6", "part 1");
    const row = (await stats.proposalStatus(db, week)).find((r) => r.name === "Seed Farah")!;
    expect(row.fetched).toBeGreaterThanOrEqual(1);
    expect(row.open_count).toBe(0);
    expect(row.first_open).toBeNull();
  });

  it("shows the recipient who opened and read", async () => {
    await need(db, "proposal_visits", "5.6", "part 1");
    const row = (await stats.proposalStatus(db, week)).find((r) => r.name === "Seed Imran")!;
    expect(row.open_count).toBe(2);
    expect(row.visible_seconds).toBe(148);
    expect(row.sections).toEqual(["ask", "fit", "trade-offs"]);
  });

  it("shows the recipient who opened and hid the tab after 10 seconds", async () => {
    await need(db, "proposal_visits", "5.6", "part 1");
    const row = (await stats.proposalStatus(db, week)).find((r) => r.name === "Seed Zara")!;
    expect(row.visible_seconds).toBe(10);
    expect(row.sections).toEqual([]);
  });

  it("keeps a recipient with no visit at all, as not opened", async () => {
    await need(db, "proposal_visits", "5.6", "part 1");
    const row = (await stats.proposalStatus(db, week)).find((r) => r.name === "Seed Omar")!;
    expect(row.fetched).toBe(0);
    expect(row.first_open).toBeNull();
  });
});

describe("share: a percentage needs its base (chapter 6.7)", () => {
  it("share(3, 4) says too few to tell", () => {
    expect(stats.share(3, 4)).toEqual({ part: 3, base: 4, percent: null, label: "too few to tell" });
  });
  it("share(30, 40) is 75 percent with no label", () => {
    expect(stats.share(30, 40)).toEqual({ part: 30, base: 40, percent: 75, label: null });
  });
  it("share(1, 5) uses the smallest base that gives a percentage", () => {
    expect(stats.share(1, 5).percent).toBe(20);
  });
  it("share(1, 3) rounds to a whole percent only when the base is big enough", () => {
    expect(stats.share(1, 3).percent).toBeNull();
    expect(stats.share(1, 7).percent).toBe(14);
  });
});

describe("blog reads (chapter 6.7)", () => {
  it("counts article pages only, most read first", async () => {
    await need(db, "views", "4.4", "part 2");
    const rows = await stats.blogReads(db, week);
    expect(rows[0].path, why("6.7", "top article")).toBe(expected.seed_top_article);
    expect(rows.every((r) => r.path.startsWith("/blog/"))).toBe(true);
  });
});

describe("link clicks (chapter 6.8)", () => {
  it("counts clicks with a recipient and public clicks apart", async () => {
    await need(db, "clicks", "6.3", "part 1");
    const rows = await stats.clicks(db, week);
    const withRecipient = rows.reduce((n, r) => n + r.with_recipient, 0);
    const pub = rows.reduce((n, r) => n + r.public_clicks, 0);
    expect(withRecipient).toBe(expected.seed_clicks_with_recipient);
    expect(pub).toBe(expected.seed_clicks_public);
  });
});

describe("the funnel (chapter 6.8)", () => {
  it("funnel below five shows too few to tell", async () => {
    await need(db, "reachouts", "6.4", "part 1");
    const funnel = await stats.funnel(db, week);
    expect(funnel.sent).toBe(expected.seed_reachouts_sent);
    expect(funnel.opened).toBe(expected.seed_funnel_opened);
    expect(funnel.clicked).toBe(expected.seed_funnel_clicked);
    expect(funnel.openedShare.percent, why("6.8", "four reach-outs is too few for a bare percentage. Use share().")).toBeNull();
    expect(funnel.openedShare.label).toBe("too few to tell");
  });

  it("a second reach-out counts only what came after it", async () => {
    await need(db, "reachouts", "6.4", "part 1");
    // Seed Imran opened on day 3 and day 5. Add a reach-out to Imran after both: it must count nothing.
    await db.query(
      "insert into reachouts (sent_at, recipient_id, channel, note) values (now(), (select id from recipients where name = 'Seed Imran'), 'email', 'late')",
    );
    try {
      const funnel = await stats.funnel(db, { from: week.from, to: new Date().toISOString().slice(0, 10) });
      const late = funnel.rows.find((r) => r.channel === "email" && r.sent_at && new Date(r.sent_at).getTime() > Date.now() - 60000)!;
      expect(late.opened, why("6.8", "this reach-out was sent after every open, so it has no open of its own")).toBe(false);
      expect(late.clicked).toBe(false);
    } finally {
      await db.query("delete from reachouts where note = 'late'");
    }
  });
});

describe("the filtered share (chapter 6.8)", () => {
  it("counts dropped rows out of dropped rows plus people views", async () => {
    await need(db, "views", "4.4", "part 2");
    const result = await stats.filteredShare(db, week);
    expect(result.dropped).toBe(expected.seed_filtered_count);
    expect(result.base, why("6.8", "the base is the dropped rows plus the views from people")).toBe(expected.seed_filtered_base);
    expect(result.share.percent).toBe(Math.round((100 * expected.seed_filtered_count) / expected.seed_filtered_base));
  });
});
