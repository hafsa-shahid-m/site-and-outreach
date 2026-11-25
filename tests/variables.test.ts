import fs from "node:fs";
import { describe, expect, it } from "vitest";

// Reads styles/variables.css and checks the values you wrote (chapter 2.13).
const css = fs.readFileSync("styles/variables.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const phoneBlock = css.match(/@media\s*\(max-width:\s*40rem\)\s*\{([\s\S]*?\})\s*\}/);
const rootCss = css.replace(/@media[\s\S]*$/, "");

function variable(name: string): string | undefined {
  const m = rootCss.match(new RegExp(`${name}\\s*:\\s*([^;]*);`));
  const value = m?.[1].trim();
  return value ? value : undefined;
}
function px(value: string | undefined): number {
  if (!value) return NaN;
  const m = value.match(/^(-?[\d.]+)(rem|px)$/);
  if (!m) return NaN;
  return m[2] === "rem" ? parseFloat(m[1]) * 16 : parseFloat(m[1]);
}
function contrast(a: string, b: string): number {
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = (hex: string) => {
    const n = hex.replace("#", "");
    const full = n.length === 3 ? n.split("").map((x) => x + x).join("") : n;
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SIZES = ["--size--1", "--size-0", "--size-1", "--size-2", "--size-3"];
const SPACES = [1, 2, 3, 4, 5, 6, 7].map((n) => `--space-${n}`);
const NAMES = [...SIZES, ...SPACES, "--measure", "--leading", "--bg", "--ink", "--muted", "--accent", "--border-width", "--focus-width", "--font-body"];

describe("style variables (chapter 2.13)", () => {
  it("every required name has a value", () => {
    const missing = NAMES.filter((n) => variable(n) === undefined);
    expect(missing, `Chapter 2.13: these variables have no value yet: ${missing.join(", ")}`).toEqual([]);
  });

  it("has five or six sizes, each step from one ratio (within 0.05)", () => {
    const sizes = [...SIZES, "--size-4"].map((n) => px(variable(n))).filter((v) => !Number.isNaN(v));
    expect(sizes.length, "Chapter 2.13: write five or six sizes in rem").toBeGreaterThanOrEqual(5);
    expect(sizes.length).toBeLessThanOrEqual(6);
    const ratios = sizes.slice(1).map((s, i) => s / sizes[i]);
    const best = Math.pow(sizes[sizes.length - 1] / sizes[0], 1 / ratios.length);
    for (const r of ratios) expect(Math.abs(r - best), `Chapter 2.13: the steps are ${ratios.map((x) => x.toFixed(2)).join(", ")} but one ratio should fit`).toBeLessThanOrEqual(0.05);
  });

  it("has seven spacing values, each 1.3 to 2 times the one before and a multiple of 0.25 rem", () => {
    const spaces = SPACES.map((n) => px(variable(n)));
    for (const [i, s] of spaces.entries()) {
      expect(Number.isNaN(s), `Chapter 2.13: ${SPACES[i]} needs a value in rem`).toBe(false);
      expect((s / 16) % 0.25, `${SPACES[i]} must be a multiple of 0.25 rem`).toBeCloseTo(0, 5);
      if (i > 0) {
        const r = s / spaces[i - 1];
        expect(r, `${SPACES[i]} is ${r.toFixed(2)} times the step before (it must be 1.3 to 2)`).toBeGreaterThanOrEqual(1.3);
        expect(r).toBeLessThanOrEqual(2.0001);
      }
    }
  });

  it("has a border width and a focus width of 1px to 4px", () => {
    for (const n of ["--border-width", "--focus-width"]) {
      const v = px(variable(n));
      expect(v, `Chapter 2.13: ${n} needs a length from 1px to 4px`).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(4);
    }
  });

  it("has a line height between 1.4 and 1.6", () => {
    const v = parseFloat(variable("--leading") ?? "NaN");
    expect(v, "Chapter 2.13: --leading between 1.4 and 1.6").toBeGreaterThanOrEqual(1.4);
    expect(v).toBeLessThanOrEqual(1.6);
  });

  it("has a measure between 45ch and 75ch", () => {
    const m = (variable("--measure") ?? "").match(/^([\d.]+)ch$/);
    expect(m, "Chapter 2.13: --measure in ch").not.toBeNull();
    expect(parseFloat(m![1])).toBeGreaterThanOrEqual(45);
    expect(parseFloat(m![1])).toBeLessThanOrEqual(75);
  });

  it("has ink, muted and accent at 4.5 to 1 or more on the background", () => {
    const bg = variable("--bg") ?? "";
    for (const n of ["--ink", "--muted", "--accent"]) {
      const v = variable(n) ?? "";
      expect(/^#[0-9a-f]{3,6}$/i.test(v) && /^#[0-9a-f]{3,6}$/i.test(bg), `Chapter 2.13: write ${n} and --bg as hex colours`).toBe(true);
      expect(contrast(v, bg), `Chapter 2.13: ${n} on --bg is ${contrast(v, bg).toFixed(2)} to 1 and needs 4.5`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("has one phone block that moves a role down a step and adds no new size", () => {
    expect(phoneBlock, "Chapter 2.13: add one @media (max-width: 40rem) block").not.toBeNull();
    const base = new Set(SIZES.map((n) => px(variable(n))));
    const redefined = [...phoneBlock![1].matchAll(/(--size-?-?\d)\s*:\s*([^;]+);/g)];
    expect(redefined.length, "the phone block should redefine at least one size").toBeGreaterThan(0);
    for (const [, name, value] of redefined) {
      expect(base.has(px(value.trim())), `${name} on a phone is ${value.trim()}, which is not one of your five sizes`).toBe(true);
    }
  });

  it("decision 4: this is not a course example", () => {
    const size0 = px(variable("--size-0"));
    const ratio = px(variable("--size-1")) / size0;
    const bg = (variable("--bg") ?? "").toLowerCase();
    const accent = (variable("--accent") ?? "").toLowerCase();
    const isS = size0 === 18 && Math.abs(ratio - 1.25) <= 0.01 && bg === "#fbf8f3" && accent === "#0b5c8f";
    const isS2 = size0 === 17 && Math.abs(ratio - 1.2) <= 0.01 && bg === "#f1f5f9" && accent === "#9a3412";
    expect(isS || isS2, "Decision 4: this is a course example. Change at least one of your base, ratio, background or accent.").toBe(false);
  });
});

describe("the typeface (chapter 2.13)", () => {
  it("loads one family from next/font/google in app/layout.tsx", () => {
    const layout = fs.readFileSync("app/layout.tsx", "utf8");
    expect(layout, "Chapter 2.13: import a family from next/font/google in app/layout.tsx").toMatch(/from\s+["']next\/font\/google["']/);
    expect(layout, "set the variable option and apply font.variable to the html element").toMatch(/variable:/);
  });
});
