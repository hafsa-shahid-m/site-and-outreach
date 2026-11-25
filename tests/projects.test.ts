import { describe, expect, it } from "vitest";
import { projects } from "../projects";

describe("projects.ts (chapter 3.4)", () => {
  it("has at least two projects", () => {
    expect(projects.length, "Chapter 3.4: move your two project write-ups into projects.ts").toBeGreaterThanOrEqual(2);
  });

  it("gives each project a what, a why and a result", () => {
    for (const p of projects) {
      for (const field of ["what", "why", "result"] as const) {
        expect(p[field]?.trim(), `Chapter 3.4: "${p.title}" has no ${field}`).toBeTruthy();
      }
    }
  });

  it("gives each project a link or a reason there is none", () => {
    for (const p of projects) {
      expect(Boolean(p.link) || Boolean(p.noLinkReason), `Chapter 3.4: "${p.title}" needs a link or noLinkReason`).toBe(true);
    }
  });

  it("has no placeholder text", () => {
    const text = JSON.stringify(projects).toLowerCase();
    for (const bad of ["todo", "lorem", "project 1"]) {
      expect(text.includes(bad), `Chapter 3.4: remove "${bad}" from projects.ts`).toBe(false);
    }
  });
});
