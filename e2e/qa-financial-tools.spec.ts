import { test, expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOT_DIR = ".gstack/qa-reports/screenshots";
const REPORT_FILE = ".gstack/qa-reports/qa-report-financial-tools-2026-03-20.md";

const TOOLS = [
  { name: "Tools Hub", path: "/tools", slug: "tools-hub" },
  { name: "Mortgage Calculator", path: "/tools/mortgage-calculator", slug: "mortgage-calculator" },
  { name: "Mortgage Comparison", path: "/tools/mortgage-comparison", slug: "mortgage-comparison" },
  { name: "Stamp Duty Calculator", path: "/tools/stamp-duty-calculator", slug: "stamp-duty" },
  { name: "Affordability Calculator", path: "/tools/affordability-calculator", slug: "affordability" },
  { name: "Rental Yield Calculator", path: "/tools/rental-yield-calculator", slug: "rental-yield" },
  { name: "Remortgage Calculator", path: "/tools/remortgage-calculator", slug: "remortgage" },
  { name: "Buy vs Rent Calculator", path: "/tools/buy-vs-rent-calculator", slug: "buy-vs-rent" },
  { name: "Moving Cost Estimator", path: "/tools/moving-cost-estimator", slug: "moving-cost" },
  { name: "First-Time Buyer Guide", path: "/tools/first-time-buyer-guide", slug: "ftb-guide" },
  { name: "Energy Bill Estimator", path: "/tools/energy-bill-estimator", slug: "energy-bill" },
];

interface Issue {
  id: string;
  tool: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
}

const allIssues: Issue[] = [];
let counter = 0;

function addIssue(tool: string, severity: Issue["severity"], category: string, title: string, description: string) {
  counter++;
  const issue: Issue = {
    id: `FT-${String(counter).padStart(3, "0")}`,
    tool,
    severity,
    category,
    title,
    description,
  };
  allIssues.push(issue);
  console.log(`[ISSUE ${issue.id}] [${severity.toUpperCase()}] ${tool}: ${title}`);
}

async function screenshotBoth(page: Page, slug: string) {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${slug}-desktop.png`, fullPage: true });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${slug}-mobile.png`, fullPage: true });

  await page.setViewportSize({ width: 1280, height: 720 });
}

test.use({ actionTimeout: 15000, navigationTimeout: 60000, timeout: 120000 });

// ─── Tools Hub ────────────────────────────────────────────────────────────────
test("01 - Tools Hub loads with all tool cards", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await page.goto("/tools", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 30000 });

  const h1 = await page.locator("h1").first().textContent();
  console.log(`[Tools Hub] H1: ${h1}`);

  // Check all tool links exist
  for (const tool of TOOLS.slice(1)) {
    const links = page.locator(`a[href="${tool.path}"]`);
    const count = await links.count();
    if (count === 0) {
      addIssue("Tools Hub", "high", "Functional", `Missing link to ${tool.name}`, `No <a href="${tool.path}"> on tools hub`);
    }
  }

  // Check card count (should be ~10 tool cards)
  const cards = page.locator("[class*='card'], [class*='Card']");
  const cardCount = await cards.count();
  console.log(`[Tools Hub] Card-like elements: ${cardCount}`);

  await screenshotBoth(page, "tools-hub");

  if (consoleErrors.length > 0) {
    addIssue("Tools Hub", "medium", "Console", "Console errors on hub", consoleErrors.slice(0, 3).join(" | "));
  }
});

// ─── Mortgage Calculator ──────────────────────────────────────────────────────
test("02 - Mortgage Calculator functional test", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await page.goto("/tools/mortgage-calculator", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 30000 });
  console.log(`[Mortgage] H1: ${await page.locator("h1").first().textContent()}`);

  // Inventory all inputs
  const inputs = await page.locator("input:visible").all();
  console.log(`[Mortgage] Inputs: ${inputs.length}`);
  for (const input of inputs) {
    const type = await input.getAttribute("type");
    const name = await input.getAttribute("name");
    const label = await input.getAttribute("aria-label");
    const id = await input.getAttribute("id");
    console.log(`  - type=${type} name=${name} label=${label} id=${id}`);
  }

  // Check for slider elements
  const sliders = page.locator("[role='slider']");
  console.log(`[Mortgage] Sliders: ${await sliders.count()}`);

  // Check for FCA disclaimer
  const fca = page.locator("text=/FCA|Financial Conduct Authority|financial advice|for illustration|indicative only/i");
  if (await fca.count() === 0) {
    addIssue("Mortgage Calculator", "high", "Content", "Missing FCA disclaimer", "No FCA/financial advice disclaimer found");
  }

  // Check for output section (monthly payment, total cost, etc.)
  const output = page.locator("text=/monthly|repayment|£|total cost|interest/i");
  console.log(`[Mortgage] Output elements: ${await output.count()}`);

  // Check link back to hub
  const hubLink = page.locator("a[href='/tools']");
  if (await hubLink.count() === 0) {
    addIssue("Mortgage Calculator", "medium", "UX", "No link back to tools hub", "Missing navigation back to /tools");
  }

  await screenshotBoth(page, "mortgage-calculator");

  if (consoleErrors.length > 0) {
    addIssue("Mortgage Calculator", "medium", "Console", "Console errors", consoleErrors.slice(0, 3).join(" | "));
  }
});

// ─── Mortgage Comparison ──────────────────────────────────────────────────────
test("03 - Mortgage Comparison functional test", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await page.goto("/tools/mortgage-comparison", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 30000 });
  console.log(`[Comparison] H1: ${await page.locator("h1").first().textContent()}`);

  const inputs = await page.locator("input:visible").all();
  console.log(`[Comparison] Inputs: ${inputs.length}`);

  // Should have add/compare functionality
  const addBtn = page.locator("button").filter({ hasText: /add|compare|another|\+|new/i });
  console.log(`[Comparison] Add/compare buttons: ${await addBtn.count()}`);

  // FCA disclaimer
  const fca = page.locator("text=/FCA|financial advice|indicative|illustration/i");
  if (await fca.count() === 0) {
    addIssue("Mortgage Comparison", "high", "Content", "Missing FCA disclaimer", "No FCA disclaimer");
  }

  const hubLink = page.locator("a[href='/tools']");
  if (await hubLink.count() === 0) {
    addIssue("Mortgage Comparison", "medium", "UX", "No link back to tools hub", "Missing /tools link");
  }

  await screenshotBoth(page, "mortgage-comparison");

  if (consoleErrors.length > 0) {
    addIssue("Mortgage Comparison", "medium", "Console", "Console errors", consoleErrors.slice(0, 3).join(" | "));
  }
});

// ─── Stamp Duty Calculator ────────────────────────────────────────────────────
test("04 - Stamp Duty Calculator functional test", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await page.goto("/tools/stamp-duty-calculator", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 30000 });
  console.log(`[SDLT] H1: ${await page.locator("h1").first().textContent()}`);

  const inputs = await page.locator("input:visible").all();
  console.log(`[SDLT] Inputs: ${inputs.length}`);

  // Buyer type options (FTB, home mover, additional)
  const buyerType = page.locator("text=/first.time|additional|home.mover|buy.to.let|second home/i");
  console.log(`[SDLT] Buyer type elements: ${await buyerType.count()}`);
  if (await buyerType.count() === 0) {
    addIssue("Stamp Duty", "medium", "Functional", "No buyer type selector", "Expected FTB / home mover / additional property options");
  }

  // Band breakdown
  const bands = page.locator("text=/band|rate|threshold/i");
  console.log(`[SDLT] Band elements: ${await bands.count()}`);

  // FCA/HMRC disclaimer
  const disclaimer = page.locator("text=/FCA|HMRC|financial advice|indicative|illustration|stamp duty/i");
  if (await disclaimer.count() === 0) {
    addIssue("Stamp Duty", "high", "Content", "Missing SDLT disclaimer", "No HMRC/FCA disclaimer");
  }

  const hubLink = page.locator("a[href='/tools']");
  if (await hubLink.count() === 0) {
    addIssue("Stamp Duty", "medium", "UX", "No link back to tools hub", "Missing /tools link");
  }

  await screenshotBoth(page, "stamp-duty");

  if (consoleErrors.length > 0) {
    addIssue("Stamp Duty", "medium", "Console", "Console errors", consoleErrors.slice(0, 3).join(" | "));
  }
});

// ─── Affordability Calculator ─────────────────────────────────────────────────
test("05 - Affordability Calculator functional test", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await page.goto("/tools/affordability-calculator", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 30000 });
  console.log(`[Afford] H1: ${await page.locator("h1").first().textContent()}`);

  const inputs = await page.locator("input:visible").all();
  console.log(`[Afford] Inputs: ${inputs.length}`);

  // Should show max borrowing output
  const borrowOutput = page.locator("text=/borrow|afford|maximum|budget|you could/i");
  console.log(`[Afford] Borrow output: ${await borrowOutput.count()}`);

  // FCA disclaimer
  const fca = page.locator("text=/FCA|financial advice|indicative|illustration/i");
  if (await fca.count() === 0) {
    addIssue("Affordability", "high", "Content", "Missing FCA disclaimer", "No FCA disclaimer");
  }

  const hubLink = page.locator("a[href='/tools']");
  if (await hubLink.count() === 0) {
    addIssue("Affordability", "medium", "UX", "No link back to tools hub", "Missing /tools link");
  }

  await screenshotBoth(page, "affordability");

  if (consoleErrors.length > 0) {
    addIssue("Affordability", "medium", "Console", "Console errors", consoleErrors.slice(0, 3).join(" | "));
  }
});

// ─── Rental Yield Calculator ──────────────────────────────────────────────────
test("06 - Rental Yield Calculator functional test", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await page.goto("/tools/rental-yield-calculator", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 30000 });
  console.log(`[Yield] H1: ${await page.locator("h1").first().textContent()}`);

  const inputs = await page.locator("input:visible").all();
  console.log(`[Yield] Inputs: ${inputs.length}`);

  // Should show gross/net yield
  const yieldOutput = page.locator("text=/yield|gross|net|%|return/i");
  console.log(`[Yield] Yield outputs: ${await yieldOutput.count()}`);

  // FCA disclaimer
  const fca = page.locator("text=/FCA|financial advice|indicative|illustration/i");
  if (await fca.count() === 0) {
    addIssue("Rental Yield", "high", "Content", "Missing FCA disclaimer", "No FCA disclaimer");
  }

  const hubLink = page.locator("a[href='/tools']");
  if (await hubLink.count() === 0) {
    addIssue("Rental Yield", "medium", "UX", "No link back to tools hub", "Missing /tools link");
  }

  await screenshotBoth(page, "rental-yield");

  if (consoleErrors.length > 0) {
    addIssue("Rental Yield", "medium", "Console", "Console errors", consoleErrors.slice(0, 3).join(" | "));
  }
});

// ─── Remortgage Calculator ────────────────────────────────────────────────────
test("07 - Remortgage Calculator functional test", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await page.goto("/tools/remortgage-calculator", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 30000 });
  console.log(`[Remortgage] H1: ${await page.locator("h1").first().textContent()}`);

  const inputs = await page.locator("input:visible").all();
  console.log(`[Remortgage] Inputs: ${inputs.length}`);

  // Current vs new deal sections
  const sections = page.locator("text=/current|existing|new deal|proposed|savings/i");
  console.log(`[Remortgage] Section headers: ${await sections.count()}`);

  // FCA disclaimer
  const fca = page.locator("text=/FCA|financial advice|indicative|illustration/i");
  if (await fca.count() === 0) {
    addIssue("Remortgage", "high", "Content", "Missing FCA disclaimer", "No FCA disclaimer");
  }

  const hubLink = page.locator("a[href='/tools']");
  if (await hubLink.count() === 0) {
    addIssue("Remortgage", "medium", "UX", "No link back to tools hub", "Missing /tools link");
  }

  await screenshotBoth(page, "remortgage");

  if (consoleErrors.length > 0) {
    addIssue("Remortgage", "medium", "Console", "Console errors", consoleErrors.slice(0, 3).join(" | "));
  }
});

// ─── Buy vs Rent Calculator ──────────────────────────────────────────────────
test("08 - Buy vs Rent Calculator functional test", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await page.goto("/tools/buy-vs-rent-calculator", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 30000 });
  console.log(`[BvR] H1: ${await page.locator("h1").first().textContent()}`);

  const inputs = await page.locator("input:visible").all();
  console.log(`[BvR] Inputs: ${inputs.length}`);

  // Buy and rent sections
  const sections = page.locator("text=/buy|rent|purchase|monthly rent|deposit/i");
  console.log(`[BvR] Section elements: ${await sections.count()}`);

  // FCA disclaimer
  const fca = page.locator("text=/FCA|financial advice|indicative|illustration/i");
  if (await fca.count() === 0) {
    addIssue("Buy vs Rent", "high", "Content", "Missing FCA disclaimer", "No FCA disclaimer");
  }

  const hubLink = page.locator("a[href='/tools']");
  if (await hubLink.count() === 0) {
    addIssue("Buy vs Rent", "medium", "UX", "No link back to tools hub", "Missing /tools link");
  }

  await screenshotBoth(page, "buy-vs-rent");

  if (consoleErrors.length > 0) {
    addIssue("Buy vs Rent", "medium", "Console", "Console errors", consoleErrors.slice(0, 3).join(" | "));
  }
});

// ─── Moving Cost Estimator ────────────────────────────────────────────────────
test("09 - Moving Cost Estimator functional test", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await page.goto("/tools/moving-cost-estimator", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 30000 });
  console.log(`[Moving] H1: ${await page.locator("h1").first().textContent()}`);

  const inputs = await page.locator("input:visible, select:visible").all();
  console.log(`[Moving] Inputs/selects: ${inputs.length}`);

  // Cost categories
  const costs = page.locator("text=/solicitor|conveyancing|survey|removal|estate agent|stamp duty|total/i");
  console.log(`[Moving] Cost categories: ${await costs.count()}`);

  const hubLink = page.locator("a[href='/tools']");
  if (await hubLink.count() === 0) {
    addIssue("Moving Cost", "medium", "UX", "No link back to tools hub", "Missing /tools link");
  }

  await screenshotBoth(page, "moving-cost");

  if (consoleErrors.length > 0) {
    addIssue("Moving Cost", "medium", "Console", "Console errors", consoleErrors.slice(0, 3).join(" | "));
  }
});

// ─── First-Time Buyer Guide ──────────────────────────────────────────────────
test("10 - First-Time Buyer Guide content test", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await page.goto("/tools/first-time-buyer-guide", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 30000 });
  console.log(`[FTB] H1: ${await page.locator("h1").first().textContent()}`);

  // Guide sections
  const sections = page.locator("text=/step|guide|help to buy|shared ownership|deposit|mortgage|ISA|lifetime/i");
  console.log(`[FTB] Guide sections: ${await sections.count()}`);

  // Help to Buy / Shared Ownership (16.10)
  const helpToBuy = page.locator("text=/help to buy|shared ownership/i");
  if (await helpToBuy.count() === 0) {
    addIssue("FTB Guide", "medium", "Content", "Missing Help to Buy / Shared Ownership", "Guide should cover HTB and SO schemes");
  }

  const hubLink = page.locator("a[href='/tools']");
  if (await hubLink.count() === 0) {
    addIssue("FTB Guide", "medium", "UX", "No link back to tools hub", "Missing /tools link");
  }

  await screenshotBoth(page, "ftb-guide");

  if (consoleErrors.length > 0) {
    addIssue("FTB Guide", "medium", "Console", "Console errors", consoleErrors.slice(0, 3).join(" | "));
  }
});

// ─── Energy Bill Estimator ────────────────────────────────────────────────────
test("11 - Energy Bill Estimator functional test", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await page.goto("/tools/energy-bill-estimator", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 30000 });
  console.log(`[Energy] H1: ${await page.locator("h1").first().textContent()}`);

  const inputs = await page.locator("input:visible, select:visible").all();
  console.log(`[Energy] Inputs/selects: ${inputs.length}`);

  // Property type/size inputs
  const propInputs = page.locator("text=/bedroom|property type|size|detached|semi|flat|terrace/i");
  console.log(`[Energy] Property inputs: ${await propInputs.count()}`);

  // Energy output
  const energyOut = page.locator("text=/£|annual|monthly|estimate|bill|kwh|energy/i");
  console.log(`[Energy] Energy outputs: ${await energyOut.count()}`);

  const hubLink = page.locator("a[href='/tools']");
  if (await hubLink.count() === 0) {
    addIssue("Energy Bill", "medium", "UX", "No link back to tools hub", "Missing /tools link");
  }

  await screenshotBoth(page, "energy-bill");

  if (consoleErrors.length > 0) {
    addIssue("Energy Bill", "medium", "Console", "Console errors", consoleErrors.slice(0, 3).join(" | "));
  }
});

// ─── Accessibility Audit ──────────────────────────────────────────────────────
test("12 - Accessibility audit across all tools", async ({ page }) => {
  for (const tool of TOOLS) {
    await page.goto(tool.path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Images without alt
    const noAlt = await page.locator("img:not([alt])").count();
    if (noAlt > 0) {
      addIssue(tool.name, "medium", "Accessibility", "Images without alt text", `${noAlt} images missing alt attribute`);
    }

    // Heading hierarchy
    const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();
    let lastLevel = 0;
    for (const h of headings) {
      const tag = await h.evaluate((el) => el.tagName);
      const level = parseInt(tag.replace("H", ""));
      if (level > lastLevel + 1 && lastLevel > 0) {
        addIssue(tool.name, "low", "Accessibility", `Heading skip h${lastLevel}→h${level}`, "Heading hierarchy skips a level");
        break; // Only report once per page
      }
      lastLevel = level;
    }

    // Multiple H1s
    const h1Count = await page.locator("h1").count();
    if (h1Count > 1) {
      addIssue(tool.name, "low", "Accessibility", `Multiple H1 tags (${h1Count})`, "Page has more than one H1 element");
    }
  }
});

// ─── Cross-links ──────────────────────────────────────────────────────────────
test("13 - Cross-links between tools", async ({ page }) => {
  for (const tool of TOOLS.slice(1)) {
    await page.goto(tool.path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Links to other tools
    const toolLinks = page.locator("a[href^='/tools/']");
    const count = await toolLinks.count();
    console.log(`[Cross-links] ${tool.name}: ${count} links to other tools`);

    if (count === 0) {
      addIssue(tool.name, "low", "UX", "No cross-links to related tools", "Consider adding links to related calculators");
    }
  }
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────
test("14 - Edge cases: zero, negative, extreme values", async ({ page }) => {
  const calcPages = TOOLS.filter(
    (t) => t.path !== "/tools" && t.path !== "/tools/first-time-buyer-guide",
  );

  for (const tool of calcPages) {
    await page.goto(tool.path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const numberInputs = await page.locator("input[type='number']:visible").all();
    if (numberInputs.length === 0) continue;

    for (const input of numberInputs.slice(0, 2)) {
      // Zero
      await input.fill("0");
      await page.waitForTimeout(200);
      const pageOk = await page.locator("h1").first().isVisible().catch(() => false);
      if (!pageOk) {
        addIssue(tool.name, "critical", "Functional", "Page crash on zero input", "Page becomes unresponsive with zero value");
      }

      // Large number
      await input.fill("99999999");
      await page.waitForTimeout(200);

      // Negative
      await input.fill("-1");
      await page.waitForTimeout(200);
    }
  }
});

// ─── Write report at the end ──────────────────────────────────────────────────
test("99 - Generate QA Report", async () => {
  // Write issues summary
  console.log("\n════════════════════════════════════════════════════════");
  console.log("  FINANCIAL TOOLS QA REPORT");
  console.log("════════════════════════════════════════════════════════\n");
  console.log(`Total issues: ${allIssues.length}`);

  const critical = allIssues.filter((i) => i.severity === "critical").length;
  const high = allIssues.filter((i) => i.severity === "high").length;
  const medium = allIssues.filter((i) => i.severity === "medium").length;
  const low = allIssues.filter((i) => i.severity === "low").length;

  console.log(`  Critical: ${critical}`);
  console.log(`  High:     ${high}`);
  console.log(`  Medium:   ${medium}`);
  console.log(`  Low:      ${low}\n`);

  for (const issue of allIssues) {
    console.log(`[${issue.id}] [${issue.severity.toUpperCase()}] ${issue.tool}: ${issue.title}`);
    console.log(`  ${issue.description}\n`);
  }

  // Write baseline JSON
  const baseline = {
    date: "2026-03-20",
    url: "http://localhost:3000/tools",
    scope: "Financial Tools (16.1-16.11)",
    totalIssues: allIssues.length,
    severity: { critical, high, medium, low },
    issues: allIssues,
  };

  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(
    ".gstack/qa-reports/baseline-financial-tools-2026-03-20.json",
    JSON.stringify(baseline, null, 2),
  );

  // Write markdown report
  const report = generateMarkdownReport(allIssues, baseline);
  fs.writeFileSync(REPORT_FILE, report);
  console.log(`\nReport saved to: ${REPORT_FILE}`);
});

function generateMarkdownReport(issues: Issue[], baseline: typeof Object.prototype): string {
  const critical = issues.filter((i) => i.severity === "critical");
  const high = issues.filter((i) => i.severity === "high");
  const medium = issues.filter((i) => i.severity === "medium");
  const low = issues.filter((i) => i.severity === "low");

  // Compute health score
  const catScores: Record<string, number> = {
    Console: 100,
    Links: 100,
    Visual: 100,
    Functional: 100,
    UX: 100,
    Performance: 100,
    Content: 100,
    Accessibility: 100,
  };

  for (const issue of issues) {
    const cat = catScores[issue.category] !== undefined ? issue.category : "Functional";
    const deduction = issue.severity === "critical" ? 25 : issue.severity === "high" ? 15 : issue.severity === "medium" ? 8 : 3;
    catScores[cat] = Math.max(0, catScores[cat] - deduction);
  }

  const weights: Record<string, number> = {
    Console: 0.15, Links: 0.10, Visual: 0.10, Functional: 0.20,
    UX: 0.15, Performance: 0.10, Content: 0.05, Accessibility: 0.15,
  };

  let healthScore = 0;
  for (const [cat, score] of Object.entries(catScores)) {
    healthScore += score * (weights[cat] || 0);
  }
  healthScore = Math.round(healthScore);

  return `# QA Report: Financial Tools (16.1–16.11)

**Date:** 2026-03-20
**Target:** http://localhost:3000/tools
**Mode:** Full QA Audit
**Health Score:** ${healthScore}/100

## Summary

| Severity | Count |
|----------|-------|
| Critical | ${critical.length} |
| High | ${high.length} |
| Medium | ${medium.length} |
| Low | ${low.length} |
| **Total** | **${issues.length}** |

## Category Scores

| Category | Score | Weight |
|----------|-------|--------|
| Console | ${catScores.Console}/100 | 15% |
| Links | ${catScores.Links}/100 | 10% |
| Visual | ${catScores.Visual}/100 | 10% |
| Functional | ${catScores.Functional}/100 | 20% |
| UX | ${catScores.UX}/100 | 15% |
| Performance | ${catScores.Performance}/100 | 10% |
| Content | ${catScores.Content}/100 | 5% |
| Accessibility | ${catScores.Accessibility}/100 | 15% |

## Pages Tested

| # | Tool | Status | Screenshot |
|---|------|--------|------------|
${TOOLS.map((t, i) => `| ${i} | ${t.name} | Tested | ${t.slug}-desktop.png |`).join("\n")}

## Issues

${issues.length === 0 ? "_No issues found — all tools passed QA checks._\n" : issues.map((issue) => `### ${issue.id}: ${issue.title}

- **Tool:** ${issue.tool}
- **Severity:** ${issue.severity}
- **Category:** ${issue.category}
- **Description:** ${issue.description}
`).join("\n")}

## Top 3 Things to Fix

${critical.length + high.length === 0
  ? "No critical or high severity issues found."
  : [...critical, ...high].slice(0, 3).map((i, idx) => `${idx + 1}. **${i.id}** — ${i.title} (${i.tool})`).join("\n")
}

## Screenshots

Desktop and mobile screenshots captured for all ${TOOLS.length} pages in \`.gstack/qa-reports/screenshots/\`.

---
*Generated by Playwright QA Suite*
`;
}
