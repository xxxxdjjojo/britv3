import { expect, type Page, type TestInfo } from "@playwright/test";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

const EVIDENCE_ROOT = "test-results/evidence/vouch-referral";
const RUNTIME_MANIFEST = join(EVIDENCE_ROOT, "evidence-manifest.json");

const FIXTURES = {
  gate_empty: { slug: "vouch-gate-empty" },
  gate_3_plus_2: { slug: "vouch-gate-3-plus-2" },
  gate_complete: { slug: "vouch-gate-complete" },
  grandfathered: { slug: "vouch-grandfathered" },
  referral_all_states: { slug: "vouch-gate-complete" },
  valid_client_token: { token: "10000000-0000-4000-8000-000000000001" },
  valid_peer_token: { token: "10000000-0000-4000-8000-000000000002" },
  expired_token: { token: "10000000-0000-4000-8000-000000000003" },
  revoked_token: { token: "10000000-0000-4000-8000-000000000004" },
  invalid_token: { token: "10000000-0000-4000-8000-999999999999" },
} as const;

type FixtureName = keyof typeof FIXTURES;
type BrowserErrors = { pageErrors: string[]; consoleErrors: string[] };
const browserErrors = new WeakMap<Page, BrowserErrors>();

export function fixture<Name extends FixtureName>(name: Name): (typeof FIXTURES)[Name] {
  return FIXTURES[name];
}

export async function assertEvidencePage(page: Page, route: string): Promise<void> {
  let errors = browserErrors.get(page);
  if (!errors) {
    errors = { pageErrors: [], consoleErrors: [] };
    browserErrors.set(page, errors);
    page.on("pageerror", (error) => browserErrors.get(page)?.pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.get(page)?.consoleErrors.push(message.text());
    });
  }
  errors.pageErrors.length = 0;
  errors.consoleErrors.length = 0;

  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response, `${route} should return a document response`).not.toBeNull();
  expect(response?.status(), `${route} should resolve below HTTP 400`).toBeLessThan(400);

  const expected = new URL(route, "http://e2e.invalid");
  const actual = new URL(page.url());
  expect(actual.pathname, `${route} should not redirect to a different route`).toBe(
    expected.pathname,
  );
  expect(actual.search, `${route} should preserve its query string`).toBe(expected.search);

  await expect(page.locator("body")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(100);

  expect(errors.pageErrors, `uncaught page errors on ${route}`).toEqual([]);
  expect(
    errors.consoleErrors.filter((message) => !/favicon\.ico/i.test(message)),
    `console errors on ${route}`,
  ).toEqual([]);
}

async function assertPageQuality(page: Page): Promise<void> {
  const quality = await page.evaluate(() => {
    const root = document.documentElement;
    const overflow = root.scrollWidth - root.clientWidth;
    const visible = (element: Element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    };

    const unlabeled = [...document.querySelectorAll("input, select, textarea")]
      .filter(visible)
      .filter((element) => {
        const input = element as HTMLInputElement;
        if (input.type === "hidden") return false;
        return !(
          input.getAttribute("aria-label") ||
          input.getAttribute("aria-labelledby") ||
          (input.id && document.querySelector(`label[for="${CSS.escape(input.id)}"]`)) ||
          input.closest("label")
        );
      })
      .map((element) => element.outerHTML.slice(0, 160));

    const smallActions = [...document.querySelectorAll("button, [data-vouch-action]")]
      .filter(visible)
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return `${element.textContent?.trim().slice(0, 40) || element.getAttribute("aria-label") || element.tagName} (${Math.round(rect.width)}x${Math.round(rect.height)})`;
      });

    const positiveTabIndexes = [...document.querySelectorAll("[tabindex]")]
      .filter(visible)
      .map((element) => Number(element.getAttribute("tabindex")))
      .filter((tabIndex) => tabIndex > 0);

    return { overflow, unlabeled, smallActions, positiveTabIndexes };
  });

  expect(quality.overflow, "page should not overflow horizontally").toBeLessThanOrEqual(1);
  expect(quality.unlabeled, "every visible form field needs an accessible label").toEqual([]);
  expect(quality.smallActions, "vouch buttons need 44px minimum tap targets").toEqual([]);
  expect(quality.positiveTabIndexes, "focus order must follow DOM order").toEqual([]);
}

export async function assertNoSensitiveVouchData(page: Page): Promise<void> {
  const text = await page.locator("body").innerText();
  expect(text, "public vouch UI must not expose an email address").not.toMatch(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  );
  expect(text, "public vouch UI must not expose a UK phone number").not.toMatch(
    /(?:\+44\s?\d{4}|0\d{4})[\s-]?\d{3}[\s-]?\d{3}/,
  );
  expect(text, "public vouch UI must not expose UUID identifiers").not.toMatch(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
  );
  expect(text, "public vouch UI must not expose internal fraud or evidence fields").not.toMatch(
    /\b(?:fraud[_ ]flag|evidence[_ ]payload|ip[_ ]address)\b/i,
  );
}

type EvidenceManifest = {
  schemaVersion: 1;
  generatedAt: string;
  commitSha: string;
  captures: Array<{
    name: string;
    route: string;
    fixture: string;
    project: string;
    viewport: { width: number; height: number };
    capturedAt: string;
    commitSha: string;
    sha256: string;
    file: string;
  }>;
};

function currentCommit(): string {
  return process.env.GITHUB_SHA ?? execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

export async function captureVouchEvidence(
  page: Page,
  testInfo: TestInfo,
  name: string,
  fixtureName: FixtureName,
): Promise<void> {
  await assertPageQuality(page);
  const errors = browserErrors.get(page);
  expect(errors?.pageErrors ?? [], "capture must have no uncaught page errors").toEqual([]);
  expect(
    (errors?.consoleErrors ?? []).filter((message) => !/favicon\.ico/i.test(message)),
    "capture must have no console errors",
  ).toEqual([]);
  await page.addStyleTag({
    content: "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important;caret-color:transparent!important}",
  });
  await page.waitForTimeout(50);

  const viewport = page.viewportSize();
  expect(viewport, "evidence project must define an exact viewport").not.toBeNull();
  const project = testInfo.project.name;
  const file = `${name}-${project}.png`;
  const outputPath = join(EVIDENCE_ROOT, file);
  mkdirSync(dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: false, animations: "disabled" });

  const sha = currentCommit();
  const capturedAt = new Date().toISOString();
  const entry: EvidenceManifest["captures"][number] = {
    name,
    route: `${new URL(page.url()).pathname}${new URL(page.url()).search}`,
    fixture: fixtureName,
    project,
    viewport: viewport!,
    capturedAt,
    commitSha: sha,
    sha256: createHash("sha256").update(readFileSync(outputPath)).digest("hex"),
    file,
  };

  const manifest: EvidenceManifest = existsSync(RUNTIME_MANIFEST)
    ? (JSON.parse(readFileSync(RUNTIME_MANIFEST, "utf8")) as EvidenceManifest)
    : { schemaVersion: 1, generatedAt: capturedAt, commitSha: sha, captures: [] };
  manifest.generatedAt = capturedAt;
  manifest.commitSha = sha;
  manifest.captures = manifest.captures.filter(
    (capture) => capture.name !== name || capture.project !== project,
  );
  manifest.captures.push(entry);

  const temporary = `${RUNTIME_MANIFEST}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
  renameSync(temporary, RUNTIME_MANIFEST);
  await testInfo.attach(name, { path: outputPath, contentType: "image/png" });
}
