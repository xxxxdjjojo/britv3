// Capture proof screenshots of the seeded trader marketplace surfaces.
// Usage: node scripts/trader-seed-screenshots.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "trader-seed-shots";
mkdirSync(OUT, { recursive: true });

const pages = [
  ["marketplace", "/marketplace"],
  ["category-plumbers", "/services/tradespeople?category=plumber"],
  ["profile-plumber", "/services/plumber/seed-plumber-01"],
  ["profile-electrician", "/services/electrician/seed-electrician-01"],
  ["location-london-plumbers", "/services/plumber/london"],
  ["category-electricians", "/services/tradespeople?category=electrician"],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();

for (const [name, path] of pages) {
  try {
    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${name}-1440.png`, fullPage: true });
    console.log(`captured ${name} <- ${path}`);
  } catch (e) {
    console.error(`FAILED ${name} (${path}): ${e.message}`);
  }
}

await browser.close();
console.log("done ->", OUT);
