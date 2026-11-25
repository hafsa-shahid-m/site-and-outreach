import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { dailyVisitorHash } from "../lib/visitor";
import { why } from "./helpers/db";

const IP = "203.0.113.7";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";

describe("daily visitor hash (chapter 4.5)", () => {
  it("is 16 hex characters", () => {
    const hash = dailyVisitorHash("2026-11-06", IP, UA);
    expect(hash, why("4.5", "take the first 16 hex characters of the HMAC")).toMatch(/^[0-9a-f]{16}$/);
  });

  it("gives the same visitor on the same day the same hash", () => {
    expect(dailyVisitorHash("2026-11-06", IP, UA)).toBe(dailyVisitorHash("2026-11-06", IP, UA));
  });

  it("the same visitor on two days gets two hashes", () => {
    const monday = dailyVisitorHash("2026-11-02", IP, UA);
    const tuesday = dailyVisitorHash("2026-11-03", IP, UA);
    expect(tuesday, why("4.5", `both days gave ${monday}. Put the date in the text you hash.`)).not.toBe(monday);
  });

  it("gives a different browser a different hash", () => {
    expect(dailyVisitorHash("2026-11-06", IP, UA)).not.toBe(dailyVisitorHash("2026-11-06", IP, "Other/1.0"));
  });

  it("uses VISITOR_SECRET, so the hash cannot be rebuilt without it", () => {
    const own = createHmac("sha256", "demo-secret-for-the-unit-tests").update(`2026-11-06|${IP}|${UA}`).digest("hex").slice(0, 16);
    expect(dailyVisitorHash("2026-11-06", IP, UA), why("4.5", "HMAC-SHA256 with VISITOR_SECRET over date|ip|user-agent")).toBe(own);
  });

  it("does not contain the IP address", () => {
    expect(dailyVisitorHash("2026-11-06", IP, UA)).not.toContain("203");
  });
});
