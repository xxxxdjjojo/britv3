#!/usr/bin/env node
/**
 * Visual QA for Stage 2 — Public Pages
 * Takes screenshots of all 25 screens at desktop (1440px) and mobile (390px)
 * Checks for broken layouts, missing content, console errors
 */

import { chromium } from "@playwright/test";
import { mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "docs", "qa-screenshots", "stage2");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const BASE = "http://localhost:3000";

const SCREENS = [
  // Marketing (Impl-1)
  { name: "homepage", path: "/", group: "marketing" },
  { name: "how-it-works", path: "/how-it-works", group: "marketing" },
  { name: "about", path: "/about", group: "marketing" },
  { name: "pricing", path: "/pricing", group: "marketing" },
  { name: "careers", path: "/careers", group: "marketing" },
  { name: "contact", path: "/contact", group: "marketing" },

  // Search (Impl-2)
  { name: "search-discovery", path: "/search?type=buy", group: "search" },
  { name: "search-list", path: "/search?type=buy&view=list", group: "search" },
  { name: "search-map", path: "/search?type=buy&view=map", group: "search" },

  // Property Detail (Impl-3)
  { name: "property-detail", path: "/properties/modern-2-bed-flat-clifton-bristol-sale", group: "property" },

  // Area Guides (Impl-4)
  { name: "areas-index", path: "/areas", group: "areas" },
  { name: "sold-prices-index", path: "/sold-prices", group: "areas" },
  { name: "market-trends", path: "/market-trends", group: "areas" },
  { name: "market-trends-national", path: "/market-trends/national", group: "areas" },

  // Tools (Impl-5)
  { name: "compare", path: "/compare", group: "tools" },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const consoleErrors = [];
  const networkErrors = [];
  const results = [];

  for (const screen of SCREENS) {
    for (const vp of VIEWPORTS) {
      const page = await context.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Capture console errors
      const pageErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          pageErrors.push(msg.text());
        }
      });
      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });

      // Capture network errors
      const pageNetworkErrors = [];
      page.on("response", (resp) => {
        if (resp.status() >= 400) {
          pageNetworkErrors.push(`${resp.status()} ${resp.url()}`);
        }
      });

      const url = `${BASE}${screen.path}`;
      const label = `${screen.name}-${vp.name}`;
      console.log(`  Screenshotting: ${label} (${url})`);

      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        // Wait a bit for animations
        await page.waitForTimeout(1000);

        // Full page screenshot
        const ssPath = join(OUT_DIR, `${label}.png`);
        await page.screenshot({ path: ssPath, fullPage: true });

        // Check for visual issues
        const checks = {};

        // Check for horizontal scroll (broken layout)
        const hasHScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        checks.horizontalScroll = !hasHScroll;

        // Check headings use font-heading class
        const headingCheck = await page.evaluate(() => {
          const h1s = document.querySelectorAll("h1, h2");
          let withFontHeading = 0;
          h1s.forEach((h) => {
            const cs = window.getComputedStyle(h);
            if (cs.fontFamily.includes("Plus Jakarta Sans") || cs.fontFamily.includes("Jakarta")) {
              withFontHeading++;
            }
          });
          return { total: h1s.length, withBrandFont: withFontHeading };
        });
        checks.headingsUsingBrandFont = headingCheck;

        // Check for pure black text (should use #1a1c1c instead)
        const hasPureBlack = await page.evaluate(() => {
          const els = document.querySelectorAll("h1, h2, h3, p, span, a, li");
          let blackCount = 0;
          els.forEach((el) => {
            const cs = window.getComputedStyle(el);
            if (cs.color === "rgb(0, 0, 0)") blackCount++;
          });
          return blackCount;
        });
        checks.pureBlackElements = hasPureBlack;

        // Check for 1px borders (should use bg shifts instead)
        const borderCount = await page.evaluate(() => {
          const all = document.querySelectorAll("*");
          let count = 0;
          all.forEach((el) => {
            const cs = window.getComputedStyle(el);
            if (
              cs.borderWidth === "1px" &&
              cs.borderStyle !== "none" &&
              cs.borderColor !== "rgba(0, 0, 0, 0)" &&
              cs.borderColor !== "transparent"
            ) {
              count++;
            }
          });
          return count;
        });
        checks.onePixelBorders = borderCount;

        // Check background uses surface color
        const bgColor = await page.evaluate(() => {
          return window.getComputedStyle(document.body).backgroundColor;
        });
        checks.bodyBackground = bgColor;

        // Check min tap targets on mobile
        let smallTapTargets = 0;
        if (vp.name === "mobile") {
          smallTapTargets = await page.evaluate(() => {
            const interactive = document.querySelectorAll("a, button, input, select, [role='button']");
            let small = 0;
            interactive.forEach((el) => {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
                // Skip hidden elements
                if (rect.width > 10 && rect.height > 10) small++;
              }
            });
            return small;
          });
          checks.smallTapTargets = smallTapTargets;
        }

        const status =
          pageErrors.length === 0 &&
          pageNetworkErrors.length === 0 &&
          !hasHScroll
            ? "PASS"
            : "ISSUES";

        results.push({
          screen: label,
          url,
          status,
          consoleErrors: pageErrors,
          networkErrors: pageNetworkErrors,
          checks,
          screenshot: `${label}.png`,
        });

        if (pageErrors.length > 0) consoleErrors.push(...pageErrors.map((e) => `${label}: ${e}`));
        if (pageNetworkErrors.length > 0) networkErrors.push(...pageNetworkErrors.map((e) => `${label}: ${e}`));
      } catch (err) {
        results.push({
          screen: label,
          url,
          status: "ERROR",
          error: err.message,
        });
      }

      await page.close();
    }
  }

  await browser.close();

  // Print report
  console.log("\n\n========================================");
  console.log("  STAGE 2 — VISUAL QA REPORT");
  console.log("========================================\n");

  let passCount = 0;
  let issueCount = 0;
  let errorCount = 0;

  for (const r of results) {
    const icon = r.status === "PASS" ? "PASS" : r.status === "ISSUES" ? "WARN" : "FAIL";
    console.log(`  [${icon}] ${r.screen}`);

    if (r.checks) {
      if (r.checks.horizontalScroll === false) console.log(`         !! Horizontal scroll detected`);
      if (r.checks.pureBlackElements > 5) console.log(`         !! ${r.checks.pureBlackElements} elements with pure black text`);
      if (r.checks.onePixelBorders > 10) console.log(`         !! ${r.checks.onePixelBorders} elements with 1px borders`);
      if (r.checks.smallTapTargets > 5) console.log(`         !! ${r.checks.smallTapTargets} tap targets < 44px`);
      if (r.checks.headingsUsingBrandFont) {
        const hc = r.checks.headingsUsingBrandFont;
        if (hc.total > 0 && hc.withBrandFont < hc.total) {
          console.log(`         !! ${hc.total - hc.withBrandFont}/${hc.total} headings missing brand font`);
        }
      }
    }

    if (r.consoleErrors?.length) console.log(`         Console errors: ${r.consoleErrors.length}`);
    if (r.networkErrors?.length) console.log(`         Network errors: ${r.networkErrors.join(", ")}`);
    if (r.error) console.log(`         Error: ${r.error}`);

    if (r.status === "PASS") passCount++;
    else if (r.status === "ISSUES") issueCount++;
    else errorCount++;
  }

  console.log(`\n  ────────────────────────────────────`);
  console.log(`  Total: ${results.length} | PASS: ${passCount} | WARN: ${issueCount} | FAIL: ${errorCount}`);
  console.log(`  Screenshots: docs/qa-screenshots/stage2/`);
  console.log(`  ────────────────────────────────────\n`);

  // Return exit code based on results
  process.exit(errorCount > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("QA script failed:", err.message);
  process.exit(1);
});
