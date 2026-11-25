import { describe, expect, it } from "vitest";
import { isOpened, isSeen } from "../lib/open-rule";
import { why } from "./helpers/db";

const base = { jsRan: true, visibleSeconds: 4, actions: 1, owner: false };

describe("isOpened (chapter 5.6)", () => {
  it("opens when JavaScript ran, 3 seconds were visible and a human acted", () => {
    expect(isOpened({ ...base, visibleSeconds: 3 }), why("5.6", "3 seconds is enough")).toBe(true);
  });
  it("does not open when the page's JavaScript never ran", () => {
    expect(isOpened({ ...base, jsRan: false })).toBe(false);
  });
  it("does not open under 3 visible seconds", () => {
    expect(isOpened({ ...base, visibleSeconds: 2 })).toBe(false);
  });
  it("does not open without a human action: a scanner that runs the page but never scrolls", () => {
    expect(isOpened({ ...base, actions: 0 }), why("5.6", "no action means no open")).toBe(false);
  });
  it("never opens for the owner", () => {
    expect(isOpened({ ...base, owner: true })).toBe(false);
  });
});

describe("isSeen (chapter 5.8)", () => {
  it("is not seen after 4 seconds", () => {
    expect(isSeen({ secondsHalfOnScreen: 4 }), why("5.8", "seen needs 5 seconds")).toBe(false);
  });
  it("is seen after 5 seconds", () => {
    expect(isSeen({ secondsHalfOnScreen: 5 })).toBe(true);
  });
  it("is not seen at 0", () => {
    expect(isSeen({ secondsHalfOnScreen: 0 })).toBe(false);
  });
});
