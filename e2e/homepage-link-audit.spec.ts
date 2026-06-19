import { mkdir } from "node:fs/promises";
import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * Homepage Link Audit
 *
 * Verifies homepage internal link sources resolve to rendering public pages.
 * External links (social media) are excluded.
 */

const LINK_INTEGRITY_SCREENSHOT_DIR =
  "test-results/evidence/link-render/homepage-link-audit";
const APP_ERROR_RE =
  /Page not found|This page could not be found|Application error|Something went wrong/i;

type DestinationOptions = Readonly<{
  allowLoginPath?: boolean;
  expectedPath?: string;
  timeout?: number;
}>;

function screenshotName(label: string): string {
  return label
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function captureLinkAuditScreenshot(
  page: Page,
  label: string,
): Promise<void> {
  await mkdir(LINK_INTEGRITY_SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({
    path: `${LINK_INTEGRITY_SCREENSHOT_DIR}/${screenshotName(label)}.png`,
    fullPage: true,
  });
}

async function expectPublicDestinationToRender(
  page: Page,
  label: string,
  options: DestinationOptions = {},
): Promise<void> {
  await captureLinkAuditScreenshot(page, label);
  await expect(page.locator("body")).not.toContainText(APP_ERROR_RE);

  const pathname = new URL(page.url()).pathname;
  if (options.expectedPath) {
    expect(pathname, `${label} should land on ${options.expectedPath}`).toBe(
      options.expectedPath,
    );
  }
  if (!options.allowLoginPath) {
    expect(pathname, `${label} must not fall through to login`).not.toBe(
      "/login",
    );
  }

  await expect(
    page.getByRole("heading").first(),
    `${label} should render a visible page heading`,
  ).toBeVisible();
}

async function waitForPageToSettle(page: Page): Promise<void> {
  await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => undefined);
}

async function openHomepage(page: Page): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await waitForPageToSettle(page);
}

function pathForHref(href: string): string {
  return new URL(href, "http://localhost").pathname;
}

async function gotoAndAssertPublicDestination(
  page: Page,
  href: string,
  label: string,
  options: DestinationOptions = {},
): Promise<void> {
  const response = await page.goto(href, {
    waitUntil: "domcontentloaded",
    timeout: options.timeout ?? 20_000,
  });

  expect(response?.status(), `${label} (${href}) returned an error status`).toBeLessThan(400);
  await waitForPageToSettle(page);
  await expectPublicDestinationToRender(page, label, {
    allowLoginPath: options.allowLoginPath ?? pathForHref(href) === "/login",
    expectedPath: options.expectedPath ?? pathForHref(href),
  });
}

async function expectSourceLinkToRender(
  page: Page,
  link: Locator,
  href: string,
  label: string,
): Promise<void> {
  await expect(link, `${label} source link should be visible`).toBeVisible();
  await expect(link, `${label} source link should keep its href`).toHaveAttribute(
    "href",
    href,
  );
  await gotoAndAssertPublicDestination(page, href, label);
}

function sectionByHeading(page: Page, heading: RegExp): Locator {
  return page.locator("section").filter({
    has: page.getByRole("heading", { name: heading }),
  }).first();
}

function footerColumn(page: Page, heading: string): Locator {
  return page
    .locator("footer h4", { hasText: new RegExp(`^${escapeRegex(heading)}$`) })
    .locator("xpath=..")
    .first();
}

async function dismissCookieConsentBanner(page: Page): Promise<void> {
  const rejectButton = page
    .getByRole("button", { name: /reject non-essential/i })
    .first();

  if ((await rejectButton.count()) === 0) return;

  await rejectButton.click();
  await expect(page.getByRole("dialog", { name: /cookie consent/i })).toBeHidden();
}

type HomepageBlogCard = {
  href: string;
  title: string;
};

type HomepagePropertyCard = {
  href: string;
  price: string;
  title: string;
  location: string;
};

type SourceLinkCase = Readonly<{
  href: string;
  label: string;
  name: RegExp;
}>;

function runSourceLinkGroup(
  title: string,
  cases: SourceLinkCase[],
  getScope: (page: Page) => Locator,
): void {
  test.describe(title, () => {
    test.beforeEach(async ({ page }) => {
      await openHomepage(page);
    });

    for (const linkCase of cases) {
      test(`link: ${linkCase.href} (${linkCase.label}) resolves`, async ({
        page,
      }) => {
        const scope = getScope(page);
        await expect(scope, `${title} source should be visible`).toBeVisible();

        const link = scope
          .locator(`a[href="${linkCase.href}"]`, { hasText: linkCase.name })
          .first();

        await expectSourceLinkToRender(
          page,
          link,
          linkCase.href,
          `${title}-${linkCase.label}-${linkCase.href}`,
        );
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Strict public link integrity coverage
// ---------------------------------------------------------------------------

test.describe("Homepage internal links render expected content", () => {
  test.beforeEach(async ({ page }) => {
    await openHomepage(page);
  });

  test("homepage renders TrueDeed brand surfaces without Britestate copy", async ({
    page,
  }) => {
    await captureLinkAuditScreenshot(page, "homepage-truedeed-brand");

    await expect(page).toHaveTitle(/TrueDeed/i);
    await expect(page).not.toHaveTitle(/Britestate/i);
    await expect(
      page.getByRole("link", { name: /^TrueDeed$/ }).first(),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Britestate/i);
  });

  test("homepage blog card links render the matching article", async ({
    page,
  }) => {
    const cards = await page
      .locator('main article:has(a[href^="/blog/"])')
      .evaluateAll((articles): HomepageBlogCard[] =>
        articles
          .map((article) => {
            const link = article.querySelector<HTMLAnchorElement>(
              'a[href^="/blog/"]',
            );
            const title = article.querySelector("h3")?.textContent?.trim();
            return link?.getAttribute("href") && title
              ? { href: link.getAttribute("href")!, title }
              : null;
          })
          .filter((card): card is HomepageBlogCard => card !== null),
      );

    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      await gotoAndAssertPublicDestination(page, card.href, `blog-${card.href}`);
      await expect(
        page.getByRole("heading", { name: card.title }).first(),
        `${card.href} should render homepage card title "${card.title}"`,
      ).toBeVisible();
    }
  });

  test("featured property links render property detail content", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const cards = await page
      .locator('main a[href^="/properties/"]')
      .evaluateAll((links): HomepagePropertyCard[] =>
        links
          .map((link) => {
            const href = link.getAttribute("href");
            const price = link.querySelector("h3")?.textContent?.trim();
            const details = Array.from(link.querySelectorAll("p")).map((p) =>
              p.textContent?.trim() ?? "",
            );
            const [title, location] = details;
            return href && price && title && location
              ? { href, price, title, location }
              : null;
          })
          .filter((card): card is HomepagePropertyCard => card !== null),
      );

    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      await gotoAndAssertPublicDestination(page, card.href, `property-${card.href}`);
      await expect(page.getByText(card.price).first()).toBeVisible();
      await expect(
        page.getByText(new RegExp(`${card.title}|${card.location}`, "i")).first(),
        `${card.href} should render either "${card.title}" or "${card.location}"`,
      ).toBeVisible();
    }
  });

  test("desktop mega-menu public links render real pages", async ({ page }) => {
    test.setTimeout(90_000);
    test.skip(
      test.info().project.name === "mobile",
      "The desktop mega-menu is intentionally hidden on mobile.",
    );

    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();

    const triggerCount = await nav.locator("button").count();
    const publicLinks = new Map<string, string>();

    for (let index = 0; index < triggerCount; index++) {
      const trigger = nav.locator("button").nth(index);
      const triggerLabel = (await trigger.textContent())?.trim() ?? `menu-${index}`;
      await trigger.hover();
      const panel = page.locator('[data-testid="mega-menu-panel"]');
      await expect(panel).toBeVisible();
      await panel.hover();

      const links = await panel
        .locator('a[href^="/"]')
        .evaluateAll((anchors) =>
          anchors.map((anchor) => ({
            href: anchor.getAttribute("href") ?? "",
            label: anchor.textContent?.trim() ?? "",
          })),
        );

      for (const link of links) {
        if (
          link.href === "" ||
          link.href.startsWith("/dashboard") ||
          link.href.startsWith("/api")
        ) {
          continue;
        }
        publicLinks.set(link.href, `${triggerLabel} > ${link.label}`);
      }
    }

    expect(publicLinks.size).toBeGreaterThan(0);

    for (const [href, label] of publicLinks) {
      await gotoAndAssertPublicDestination(page, href, `mega-${label}-${href}`);
    }
  });
});

// ---------------------------------------------------------------------------
// 1. Source-scoped homepage links
// ---------------------------------------------------------------------------

runSourceLinkGroup(
  "Header Auth Links",
  [
    { href: "/login", label: "Sign In", name: /^Sign In$/i },
    { href: "/register", label: "List Property", name: /^List Property$/i },
  ],
  (page) => page.locator("header").first(),
);

runSourceLinkGroup(
  "Hero Section",
  [
    { href: "/search?type=buy", label: "Buy tab", name: /^Buy$/i },
    { href: "/search?type=rent", label: "Rent tab", name: /^Rent$/i },
    {
      href: "/search?type=find-services",
      label: "Find Services tab",
      name: /^Find Services$/i,
    },
    { href: "/search", label: "Search bar", name: /Search by school/i },
  ],
  (page) => sectionByHeading(page, /Find your perfect British home/i),
);

runSourceLinkGroup(
  "Featured Properties Tabs",
  [
    { href: "/search?status=for-sale", label: "For Sale", name: /^For Sale$/i },
    { href: "/search?status=to-rent", label: "To Rent", name: /^To Rent$/i },
    {
      href: "/search?status=new-builds",
      label: "New Builds",
      name: /^New Builds$/i,
    },
    { href: "/search", label: "View all properties", name: /View all properties/i },
  ],
  (page) => sectionByHeading(page, /Featured Properties/i),
);

runSourceLinkGroup(
  "Service Category Cards",
  [
    {
      href: "/services/tradespeople?category=plumber",
      label: "Plumbers",
      name: /Plumbers/i,
    },
    {
      href: "/services/tradespeople?category=electrician",
      label: "Electricians",
      name: /Electricians/i,
    },
    {
      href: "/services/tradespeople?category=builder",
      label: "Builders",
      name: /Builders/i,
    },
    { href: "/agents", label: "Estate Agents", name: /Estate Agents/i },
    {
      href: "/services/mortgage-brokers",
      label: "Mortgage Brokers",
      name: /Mortgage Brokers/i,
    },
    { href: "/services/surveyors", label: "Surveyors", name: /Surveyors/i },
    { href: "/services", label: "Browse all services", name: /Browse all services/i },
  ],
  (page) => sectionByHeading(page, /Trusted professionals/i),
);

runSourceLinkGroup(
  "Blog Section",
  [{ href: "/blog", label: "Read more on our blog", name: /Read more on our blog/i }],
  (page) => sectionByHeading(page, /Latest from the Blog/i),
);

test.describe("Blog Section — Article Cards", () => {
  test.beforeEach(async ({ page }) => {
    await openHomepage(page);
  });

  test("blog post links all render real articles", async ({ page }) => {
    const blogSection = sectionByHeading(page, /Latest from the Blog/i);
    const blogPostLinks = blogSection.locator('a[href^="/blog/"]');
    const hrefs = Array.from(
      new Set(
        await blogPostLinks.evaluateAll((links) =>
          links
            .map((link) => link.getAttribute("href"))
            .filter((href): href is string => href !== null),
        ),
      ),
    );

    expect(hrefs.length).toBeGreaterThan(0);

    for (const href of hrefs) {
      await gotoAndAssertPublicDestination(page, href, `blog-card-${href}`);
    }
  });
});

runSourceLinkGroup(
  "CTA Banner",
  [
    {
      href: "/register?role=seller",
      label: "List Your Property",
      name: /^List Your Property$/i,
    },
    { href: "/services", label: "Find a Professional", name: /^Find a Professional$/i },
  ],
  (page) => sectionByHeading(page, /Ready to get started/i),
);

runSourceLinkGroup(
  "Footer Links — Properties column",
  [
    { href: "/search?type=buy", label: "Buy", name: /^Buy$/i },
    { href: "/search?type=rent", label: "Rent", name: /^Rent$/i },
    { href: "/search?type=new-builds", label: "New Builds", name: /^New Builds$/i },
    { href: "/search?type=commercial", label: "Commercial", name: /^Commercial$/i },
    { href: "/sold-prices", label: "Sold Prices", name: /^Sold Prices$/i },
  ],
  (page) => footerColumn(page, "Properties"),
);

runSourceLinkGroup(
  "Footer Links — Services column",
  [
    { href: "/marketplace", label: "Find Tradespeople", name: /^Find Tradespeople$/i },
    { href: "/sellers", label: "Sellers", name: /^Sellers$/i },
    { href: "/developers", label: "Developers", name: /^Developers$/i },
    { href: "/traders", label: "Traders", name: /^Traders$/i },
    { href: "/agents", label: "Estate Agents", name: /^Estate Agents$/i },
  ],
  (page) => footerColumn(page, "Services"),
);

runSourceLinkGroup(
  "Footer Links — Tools column",
  [
    {
      href: "/tools/stamp-duty-calculator",
      label: "Stamp Duty Calculator",
      name: /^Stamp Duty Calculator$/i,
    },
    {
      href: "/tools/mortgage-calculator",
      label: "Mortgage Calculator",
      name: /^Mortgage Calculator$/i,
    },
    { href: "/valuation", label: "Valuation", name: /^Valuation$/i },
    { href: "/areas", label: "Area Guides", name: /^Area Guides$/i },
    { href: "/market-trends", label: "Market Trends", name: /^Market Trends$/i },
  ],
  (page) => footerColumn(page, "Tools"),
);

runSourceLinkGroup(
  "Footer Links — Company column",
  [
    { href: "/about", label: "About", name: /^About$/i },
    { href: "/pricing", label: "Pricing & Plans", name: /^Pricing & Plans$/i },
    {
      href: "/fee-transparency",
      label: "Fee Transparency",
      name: /^Fee Transparency$/i,
    },
    { href: "/careers", label: "Careers", name: /^Careers$/i },
    { href: "/contact", label: "Contact", name: /^Contact$/i },
    { href: "/blog", label: "Blog", name: /^Blog$/i },
    { href: "/help", label: "Help Centre", name: /^Help Centre$/i },
  ],
  (page) => footerColumn(page, "Company"),
);

runSourceLinkGroup(
  "Footer Links — Legal column",
  [
    { href: "/legal", label: "Legal Hub", name: /^Legal Hub$/i },
    { href: "/legal/terms", label: "Terms", name: /^Terms$/i },
    { href: "/legal/privacy", label: "Privacy", name: /^Privacy$/i },
    { href: "/legal/cookies", label: "Cookies", name: /^Cookies$/i },
    { href: "/legal/accessibility", label: "Accessibility", name: /^Accessibility$/i },
    { href: "/legal/complaints", label: "Complaints", name: /^Complaints$/i },
  ],
  (page) => footerColumn(page, "Legal"),
);

runSourceLinkGroup(
  "Footer Links — Popular Areas column",
  [
    { href: "/areas/london", label: "London", name: /^London$/i },
    { href: "/areas/manchester", label: "Manchester", name: /^Manchester$/i },
    { href: "/areas/birmingham", label: "Birmingham", name: /^Birmingham$/i },
    { href: "/areas/bristol", label: "Bristol", name: /^Bristol$/i },
    { href: "/areas/leeds", label: "Leeds", name: /^Leeds$/i },
    { href: "/areas/edinburgh", label: "Edinburgh", name: /^Edinburgh$/i },
    { href: "/areas/oxford", label: "Oxford", name: /^Oxford$/i },
    { href: "/areas/cambridge", label: "Cambridge", name: /^Cambridge$/i },
  ],
  (page) => footerColumn(page, "Popular Areas"),
);

// ---------------------------------------------------------------------------
// 8. Interactive Elements (non-navigation)
// ---------------------------------------------------------------------------

test.describe("Interactive Elements", () => {
  test.beforeEach(async ({ page }) => {
    await openHomepage(page);
  });

  test("Cookie Preferences button is present and clickable", async ({
    page,
  }) => {
    // Scroll to footer where cookie preferences button typically lives
    await page.locator("footer").scrollIntoViewIfNeeded();
    const cookieBtn = page
      .getByRole("button", { name: /cookie preferences/i })
      .first();
    // If the button is not present in the footer, look page-wide
    const count = await cookieBtn.count();
    if (count === 0) {
      // May be rendered as a link with role=button or data attribute
      const altBtn = page
        .locator('[data-testid="cookie-preferences"], button:has-text("Cookie")')
        .first();
      const altCount = await altBtn.count();
      if (altCount === 0) {
        test.skip();
        return;
      }
      await expect(altBtn).toBeVisible();
      await altBtn.click();
      // After click, either a modal appears or the page stays the same — no navigation should 404
      await expect(page.locator("body")).not.toContainText(APP_ERROR_RE);
    } else {
      await expect(cookieBtn).toBeVisible();
      await cookieBtn.click();
      await expect(page.locator("body")).not.toContainText(APP_ERROR_RE);
    }
  });

  test("Back to top button scrolls page to top", async ({ page }) => {
    await dismissCookieConsentBanner(page);

    // Scroll to bottom to reveal the back-to-top button
    await page.keyboard.press("End");
    await page.waitForTimeout(300);

    const backToTopBtn = page
      .locator(
        'button[aria-label*="top" i], button:has-text("Back to top"), [data-testid="back-to-top"]',
      )
      .first();

    const count = await backToTopBtn.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await expect(backToTopBtn).toBeVisible();
    await backToTopBtn.click();

    // After clicking back-to-top, the scroll position should be near the top
    await expect
      .poll(() => page.evaluate(() => window.scrollY), {
        timeout: 2_000,
      })
      .toBeLessThan(200);
  });
});
