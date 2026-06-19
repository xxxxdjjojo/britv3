import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE =
  process.env.SHOT_BASE ??
  "https://britv3-1wnazt1r4-bris-projects-b6e8efeb.vercel.app";
const OUT = "legal-shots";
mkdirSync(OUT, { recursive: true });

const targets = [
  { path: "/legal", name: "hub-desktop", width: 1440 },
  { path: "/legal", name: "hub-mobile", width: 390 },
  { path: "/legal/fair-housing", name: "fair-housing", width: 1440 },
  { path: "/legal/refunds", name: "refunds", width: 1440 },
  { path: "/legal/third-party-services", name: "third-party-services", width: 1440 },
  { path: "/legal/regulatory", name: "regulatory", width: 1440 },
  { path: "/legal/professional-standards", name: "professional-standards", width: 1440 },
];

const browser = await chromium.launch();
for (const t of targets) {
  const ctx = await browser.newContext({
    viewport: { width: t.width, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const res = await page.goto(`${BASE}${t.path}`, {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await page.waitForTimeout(800);
  const file = `${OUT}/${t.name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(`${res?.status()}  ${t.path}  -> ${file}`);
  await ctx.close();
}
await browser.close();
console.log("DONE");
