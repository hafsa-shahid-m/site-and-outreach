import { describe, expect, it } from "vitest";
import { scale } from "../components/Chart";
import { why } from "./helpers/db";

describe("the chart scale (chapter 6.7)", () => {
  it("zero maps to the baseline", () => {
    expect(scale(0, 40, 200), why("6.7", "a bar chart starts at zero, never at the smallest value")).toBe(0);
  });
  it("the largest value maps to the full length", () => {
    expect(scale(40, 40, 200), why("6.7", "the largest value must reach the top")).toBe(200);
  });
  it("is in proportion: a bar twice as long means twice as much", () => {
    expect(scale(10, 40, 200)).toBe(50);
    expect(scale(20, 40, 200)).toBe(2 * scale(10, 40, 200));
  });
  it("does not divide by zero when every value is zero", () => {
    expect(scale(0, 0, 200)).toBe(0);
  });
});
