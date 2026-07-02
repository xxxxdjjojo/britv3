/**
 * Phase 0 responsive audit — NOT wired into CI.
 * For each route × viewport width, detects:
 *  - per-element horizontal overflow (body has overflow-x:hidden, so page-level checks are blind)
 *  - tap targets < 44×44 (at touch widths 390/768)
 *  - form controls with computed font-size < 16px (at 390)
 * Saves JSON findings + evidence screenshots (360/768/1440).
 *
 * Usage: node scripts/responsive-audit.mjs [--base http://localhost:3170] [--only <substring>]
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const BASE = argOf("--base") ?? process.env.AUDIT_BASE_URL ?? "http://localhost:3170";
const ONLY = argOf("--only");
const OUT_DIR = path.join(process.cwd(), ".gstack", "goal-runs", "audit");
const SHOT_DIR = path.join(OUT_DIR, "screenshots");
fs.mkdirSync(SHOT_DIR, { recursive: true });

const VIEWPORTS = [
  { w: 320, h: 568 },
  { w: 360, h: 640 },
  { w: 390, h: 844 },
  { w: 414, h: 896 },
  { w: 640, h: 960 },
  { w: 768, h: 1024 },
  { w: 1024, h: 768 },
  { w: 1280, h: 800 },
  { w: 1440, h: 900 },
];
const SHOT_WIDTHS = new Set([360, 768, 1440]);
const TOUCH_CHECK_WIDTHS = new Set([390, 768]);

/** role: null = anonymous. Auth states from e2e/.auth/<role>.json (playwright setup project). */
const ROUTES = [
  // Public core
  { path: "/", role: null },
  { path: "/search", role: null },
  { path: "/search/map", role: null, map: true },
  { path: "/search/market-map/kensington-and-chelsea", role: null, map: true },
  { path: "/properties/modern-2-bed-flat-clifton-bristol-sale", role: null },
  { path: "/sold-prices", role: null },
  { path: "@property-rent", role: null },
  { path: "/compare", role: null },
  { path: "/post-a-job", role: null },
  { path: "/valuation", role: null },
  { path: "/value-my-property", role: null },
  { path: "/value-my-property/address", role: null },
  // Directories / SEO
  { path: "/services", role: null },
  { path: "@service-pro", role: null },
  { path: "/professionals/ealing/plumbers", role: null },
  { path: "@agent-profile", role: null },
  { path: "/marketplace", role: null },
  { path: "/new-homes", role: null },
  { path: "@new-home", role: null },
  { path: "/areas", role: null },
  { path: "@area", role: null },
  { path: "/area-prices", role: null },
  { path: "@sold-area", role: null },
  { path: "/blog", role: null },
  { path: "/blog/how-to-buy-a-house-uk", role: null },
  { path: "/reviews", role: null },
  { path: "/tools/mortgage-calculator", role: null },
  { path: "/tools", role: null },
  { path: "/legal/privacy", role: null },
  { path: "/pricing", role: null },
  { path: "/how-it-works", role: null },
  // Auth
  { path: "/login", role: null },
  { path: "/register", role: null },
  { path: "/register/role-select", role: null },
  // Protected — role dashboards (overview each) + depth exemplars
  { path: "/dashboard/homebuyer", role: "homebuyer" },
  { path: "/dashboard/homebuyer/saved", role: "homebuyer" },
  { path: "/dashboard/homebuyer/billing", role: "homebuyer" },
  { path: "/dashboard/renter", role: "renter" },
  { path: "/dashboard/seller", role: "seller" },
  { path: "/dashboard/seller/listings", role: "seller" },
  { path: "/dashboard/landlord", role: "landlord" },
  { path: "/dashboard/landlord/rent", role: "landlord" },
  { path: "/dashboard/landlord/compliance", role: "landlord" },
  { path: "/dashboard/landlord/finance/expenses", role: "landlord" },
  { path: "/dashboard/agent", role: "agent" },
  { path: "/dashboard/agent/crm", role: "agent" },
  { path: "/dashboard/agent/listings", role: "agent" },
  { path: "/dashboard/provider", role: "provider" },
  { path: "/dashboard/provider/quotes", role: "provider" },
  { path: "/dashboard/provider/jobs/leads", role: "provider" },
  { path: "/dashboard/broker", role: "mortgage_broker" },
  { path: "/dashboard/broker/pipeline", role: "mortgage_broker" },
  { path: "/inbox", role: "homebuyer" },
  { path: "/settings", role: "homebuyer" },
  { path: "/notifications", role: "homebuyer" },
  // Splash
  { path: "/coming-soon", role: null },
];

/** Discover real slugs from listing pages so dynamic routes get live exemplars. */
async function discover(page) {
  const found = {};
  const grab = async (url, patterns) => {
    try {
      await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(2500);
      const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
      for (const [key, re] of patterns) {
        if (found[key]) continue;
        const hit = hrefs.find((h) => h && re.test(h));
        if (hit) found[key] = hit.split("?")[0];
      }
    } catch (e) {
      console.error(`discovery failed for ${url}: ${e.message}`);
    }
  };
  await grab("/search", [["@property-sale", /^\/properties\/[^/]+$/]]);
  await grab("/search?listingType=rent", [["@property-rent", /^\/properties\/[^/]+$/]]);
  await grab("/search/map", [["@market-map", /^\/search\/market-map\/[^/]+/]]);
  await grab("/professionals/ealing/plumbers", [["@service-pro", /^\/services\/[^/]+\/[^/]+$/]]);
  await grab("/agents", [["@agent-profile", /^\/agents\/[^/]+$/]]);
  await grab("/new-homes", [["@new-home", /^\/new-homes\/[^/]+$/]]);
  await grab("/areas", [["@area", /^\/areas\/[^/]+\/[^/]+$/]]);
  await grab("/sold-prices", [["@sold-area", /^\/sold-prices\/[^/]+$/]]);
  if (!found["@market-map"]) {
    // fall back: market-map links may render inside the map UI only; try the national page
    await grab("/market-trends/national", [["@market-map", /^\/search\/market-map\/[^/]+/]]);
  }
  if (!found["@property-rent"]) found["@property-rent"] = found["@property-sale"];
  return found;
}

// Static audit expression executed in the page via Playwright page.evaluate().
// No external/user input is interpolated (only the __TOUCH__ boolean literal),
// so this is not an eval() injection surface.
const AUDIT_JS = `(() => {
  const vw = document.documentElement.clientWidth;
  const out = { overflow: [], tap: [], smallFont: [], docScrollWidth: document.documentElement.scrollWidth, vw };
  const descr = (el) => {
    const tag = el.tagName.toLowerCase();
    const cls = (typeof el.className === "string" ? el.className : "").trim().split(/\\s+/).slice(0, 4).join(".");
    const txt = (el.textContent || "").trim().slice(0, 40).replace(/\\s+/g, " ");
    const id = el.id ? "#" + el.id : "";
    return tag + id + (cls ? "." + cls : "") + (txt ? " \\u201C" + txt + "\\u201D" : "");
  };
  const isVisible = (el, r) => {
    if (r.width <= 0 || r.height <= 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  };
  // clipped by a scroll/clip container (not body/html)? then it's contained, not page overflow
  const isContained = (el) => {
    let p = el.parentElement;
    while (p && p !== document.body && p !== document.documentElement) {
      const o = getComputedStyle(p);
      if (/(auto|scroll|hidden|clip)/.test(o.overflowX) || /(auto|scroll|hidden|clip)/.test(o.overflow)) return true;
      p = p.parentElement;
    }
    return false;
  };
  const seen = new Set();
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (!isVisible(el, r)) continue;
    if (r.right > vw + 1 || r.left < -1) {
      if (isContained(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.position === "fixed" && r.left >= vw - 1) continue; // offscreen drawers/sheets by design
      const key = descr(el).slice(0, 60);
      if (seen.has("o:" + key)) continue;
      seen.add("o:" + key);
      out.overflow.push({ el: descr(el), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) });
      if (out.overflow.length > 25) break;
    }
  }
  if (__TOUCH__) {
    for (const el of document.querySelectorAll('a, button, [role="button"], input:not([type=hidden]), select, textarea, summary')) {
      const r = el.getBoundingClientRect();
      if (!isVisible(el, r)) continue;
      const cs = getComputedStyle(el);
      if (el.tagName === "A" && cs.display === "inline") continue; // WCAG inline-link exemption
      if (Math.min(r.width, r.height) < 43) {
        const key = el.tagName + ":" + (typeof el.className === "string" ? el.className : "").slice(0, 50);
        if (seen.has("t:" + key)) continue;
        seen.add("t:" + key);
        out.tap.push({ el: descr(el), w: Math.round(r.width), h: Math.round(r.height) });
        if (out.tap.length > 30) break;
      }
    }
    for (const el of document.querySelectorAll("input:not([type=hidden]), select, textarea")) {
      const r = el.getBoundingClientRect();
      if (!isVisible(el, r)) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 16) {
        const key = el.tagName + ":" + (typeof el.className === "string" ? el.className : "").slice(0, 50) + fs;
        if (seen.has("f:" + key)) continue;
        seen.add("f:" + key);
        out.smallFont.push({ el: descr(el), fontSize: fs });
        if (out.smallFont.length > 20) break;
      }
    }
  }
  return out;
})()`;

async function main() {
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const discovery = await (async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const d = await discover(page);
    await ctx.close();
    return d;
  })();
  console.log("discovered:", JSON.stringify(discovery));

  const results = [];
  const contexts = new Map(); // role -> context
  const getContext = async (role) => {
    const key = role ?? "__anon__";
    if (contexts.has(key)) return contexts.get(key);
    const opts = { viewport: { width: 1280, height: 900 } };
    if (role) {
      const authFile = `e2e/.auth/${role}.json`;
      if (!fs.existsSync(authFile)) throw new Error(`missing auth state ${authFile}`);
      opts.storageState = authFile;
    }
    const ctx = await browser.newContext(opts);
    contexts.set(key, ctx);
    return ctx;
  };

  for (const route of ROUTES) {
    const resolved = route.path.startsWith("@") ? discovery[route.path] : route.path;
    if (!resolved) {
      results.push({ route: route.path, error: "slug discovery failed" });
      console.log(`SKIP ${route.path} — no slug discovered`);
      continue;
    }
    if (ONLY && !ONLY.split(",").some((s) => resolved.includes(s))) continue;
    let ctx;
    try {
      ctx = await getContext(route.role);
    } catch (e) {
      results.push({ route: resolved, error: e.message });
      continue;
    }
    const page = await ctx.newPage();
    const entry = { route: resolved, role: route.role, finalUrl: null, viewports: {} };
    try {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.w, height: vp.h });
        if (!entry.finalUrl) {
          await page.goto(BASE + resolved, {
            waitUntil: "domcontentloaded",
            timeout: Number(process.env.AUDIT_NAV_TIMEOUT ?? 90000),
          });
          await page.waitForTimeout(route.map ? 6000 : 3000);
          entry.finalUrl = page.url().replace(BASE, "");
        } else {
          await page.waitForTimeout(600); // let responsive relayout settle
        }
        const touch = TOUCH_CHECK_WIDTHS.has(vp.w);
        const audit = await page.evaluate(AUDIT_JS.replace("__TOUCH__", String(touch)));
        entry.viewports[vp.w] = audit;
        if (SHOT_WIDTHS.has(vp.w)) {
          const slug = resolved.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 60);
          await page.screenshot({
            path: path.join(SHOT_DIR, `${slug}__${vp.w}.png`),
            fullPage: !route.map,
          }).catch(() => {});
        }
      }
      const totals = Object.entries(entry.viewports)
        .map(([w, a]) => `${w}:${a.overflow.length}o${a.tap ? "/" + a.tap.length + "t" : ""}`)
        .join(" ");
      console.log(`OK ${resolved} ${route.role ? "[" + route.role + "]" : ""} → ${entry.finalUrl} | ${totals}`);
    } catch (e) {
      entry.error = e.message?.slice(0, 200);
      console.log(`ERR ${resolved}: ${entry.error}`);
    }
    results.push(entry);
    await page.close();
  }

  const outName = argOf("--out") ?? "audit-results.json";
  const outPath = path.join(OUT_DIR, outName);
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nwrote ${outPath} (${results.length} routes)`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
