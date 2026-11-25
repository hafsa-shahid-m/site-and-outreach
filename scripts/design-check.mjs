// npm run design-check
// Needs the running site at http://localhost:3000 (start it with npm run dev in another terminal).
// Measures the home page, the about page, the blog index, the newest article and /style at 375 and 1280 pixels,
// and writes design-report.json. Commit that file: the canonical check compares it with its own measurement.
import fs from "node:fs";
import { chromium } from "@playwright/test";
import { lengthsFromVariables, lighthouseScore, measurePage, newestArticlePath } from "./design-measure.mjs";

const base = (process.env.DESIGN_CHECK_URL || "http://localhost:3000").replace(/\/+$/, "");
const chromePath = process.env.CHROME_PATH || undefined;

try {
  await fetch(base, { signal: AbortSignal.timeout(8000) });
} catch {
  console.error(`design-check could not reach ${base}.`);
  console.error("Start the site in another terminal with: npm run dev");
  process.exit(1);
}

let browser;
try {
  browser = await chromium.launch({ executablePath: chromePath });
} catch (error) {
  console.error(`The browser did not start: ${error.message.split("\n")[0]}`);
  console.error("If it says the executable does not exist, run: npx playwright install chromium");
  process.exit(1);
}

const scale = lengthsFromVariables(fs.readFileSync("styles/variables.css", "utf8"));
const article = await newestArticlePath(base);
const paths = ["/", "/about", "/blog", article, "/style"];
const widths = [375, 1280];

const report = { version: 1, widths, pages: {}, skipped: [], accessibility: null };
const scores = [];

for (const path of paths) {
  if (!path) {
    report.skipped.push({ path: "newest article", reason: "no article yet" });
    continue;
  }
  const entry = {};
  let measured = true;
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await context.newPage();
    await page.goto(base + path, { waitUntil: "networkidle" });
    const result = await measurePage(page, scale);
    await context.close();
    if (result.main_text_length < 20) {
      report.skipped.push({ path, reason: "no body text" });
      measured = false;
      break;
    }
    const { main_text_length, ...rest } = result;
    entry[String(width)] = rest;
  }
  if (!measured) continue;
  let score = null;
  for (let attempt = 0; attempt < 2 && score === null; attempt++) {
    try {
      score = await lighthouseScore(base + path, chromePath);
    } catch (error) {
      if (attempt === 1) {
        console.error(`Lighthouse did not finish for ${path}: ${error.message.split("\n")[0]}`);
        process.exit(1);
      }
    }
  }
  entry.accessibility = score;
  scores.push(score);
  report.pages[path] = entry;
  console.log(`${path}: measured, accessibility ${score}`);
}

await browser.close();
report.accessibility = scores.length ? Math.min(...scores) : null;
fs.writeFileSync("design-report.json", JSON.stringify(report, null, 2) + "\n");
console.log("Wrote design-report.json");
for (const item of report.skipped) console.log(`Skipped ${item.path}: ${item.reason}`);
