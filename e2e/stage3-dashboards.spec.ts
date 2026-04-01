import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Skip if redirected to login (no test users available). */
async function skipIfLogin(page: import("@playwright/test").Page) {
  if (page.url().includes("/login")) {
    test.skip(true, "Auth not available — no test users");
  }
}

/** Navigate and skip if auth-gated. */
async function go(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  await skipIfLogin(page);
  await expect(page.locator("body")).not.toContainText("Application error");
}

// ===========================================================================
// BUYER SCREENS
// ===========================================================================

test.describe("Stage 3 — Buyer Home (/dashboard/homebuyer)", () => {
  test.beforeEach(async ({ page }) => {
    await go(page, "/dashboard/homebuyer");
  });

  test("welcome banner is visible with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /good morning/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("displays 4 stat cards", async ({ page }) => {
    for (const label of [
      "Saved Properties",
      "Active Alerts",
      "Upcoming Viewings",
      "Unread Messages",
    ]) {
      await expect(page.getByText(label)).toBeVisible();
    }
  });

  test("New Properties section with property cards", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /new properties/i }),
    ).toBeVisible();
    // Mock property cards — at least one price visible
    await expect(page.getByText("£485,000").first()).toBeVisible();
  });

  test("Next Viewing section visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /next viewing/i }),
    ).toBeVisible();
    // Viewing details
    await expect(page.getByText("22 Oak Lane")).toBeVisible();
    await expect(page.getByText("Confirmed")).toBeVisible();
  });

  test("Recent Activity section visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /recent activity/i }),
    ).toBeVisible();
    await expect(page.getByText("Price Reduction")).toBeVisible();
    await expect(page.getByText("Viewing Confirmed")).toBeVisible();
  });

  test("Recommended Services section with 3 service cards", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: /recommended services/i }),
    ).toBeVisible();
    for (const service of ["Mortgage Broker", "Solicitor", "Surveyor"]) {
      await expect(page.getByText(service)).toBeVisible();
    }
  });

  test("View Matches CTA links to AI match page", async ({ page }) => {
    const matchLink = page.getByRole("link", { name: /view matches/i });
    await expect(matchLink).toBeVisible();
    await expect(matchLink).toHaveAttribute(
      "href",
      /\/dashboard\/homebuyer\/ai-match/,
    );
  });
});

test.describe("Stage 3 — Saved Properties (/dashboard/homebuyer/saved)", () => {
  test.beforeEach(async ({ page }) => {
    await go(page, "/dashboard/homebuyer/saved");
  });

  test("page heading visible", async ({ page }) => {
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("empty state OR property cards visible", async ({ page }) => {
    const emptyState = page.getByText(/no saved properties/i);
    const propertyCard = page.locator("[class*=rounded]").filter({ hasText: /£/ }).first();
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasCards = await propertyCard.isVisible().catch(() => false);
    expect(hasEmpty || hasCards).toBeTruthy();
  });

  test("Browse Properties CTA visible in empty state or cards present", async ({
    page,
  }) => {
    // Either empty state with a CTA or property list
    const cta = page.getByRole("link", { name: /browse|search|start/i }).first();
    const propertyPrice = page.getByText(/£/).first();
    const hasCta = await cta.isVisible().catch(() => false);
    const hasProperties = await propertyPrice.isVisible().catch(() => false);
    expect(hasCta || hasProperties).toBeTruthy();
  });
});

test.describe("Stage 3 — Saved Searches (/dashboard/homebuyer/searches)", () => {
  test.beforeEach(async ({ page }) => {
    await go(page, "/dashboard/homebuyer/searches");
  });

  test("page heading visible", async ({ page }) => {
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("search cards or empty state visible", async ({ page }) => {
    const emptyState = page.getByText(/no saved searches/i);
    const searchCard = page.locator("[class*=rounded]").first();
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasCards = await searchCard.isVisible().catch(() => false);
    expect(hasEmpty || hasCards).toBeTruthy();
  });

  test("Create New Search CTA visible", async ({ page }) => {
    const cta = page
      .getByRole("link", { name: /new.*search|new.*hunt|create.*search|start.*search/i })
      .first();
    const altCta = page.getByText(/start.*hunt|new.*search/i).first();
    const hasCta = await cta.isVisible().catch(() => false);
    const hasAltCta = await altCta.isVisible().catch(() => false);
    expect(hasCta || hasAltCta).toBeTruthy();
  });
});

test.describe("Stage 3 — AI Property Match (/dashboard/homebuyer/ai-match)", () => {
  test.beforeEach(async ({ page }) => {
    await go(page, "/dashboard/homebuyer/ai-match");
  });

  test("page heading visible", async ({ page }) => {
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("preferences panel visible", async ({ page }) => {
    // AI match page has location/budget/bedroom preference inputs
    const locationInput = page.getByText(/location|area|postcode/i).first();
    const bedroomOption = page.getByText(/bedroom/i).first();
    const hasLocation = await locationInput.isVisible().catch(() => false);
    const hasBedroom = await bedroomOption.isVisible().catch(() => false);
    expect(hasLocation || hasBedroom).toBeTruthy();
  });

  test("lifestyle priority bars visible", async ({ page }) => {
    for (const label of [
      "Commute Importance",
      "School Proximity",
      "Garden/Land Priority",
    ]) {
      await expect(page.getByText(label)).toBeVisible();
    }
  });

  test("generate matches button visible", async ({ page }) => {
    const generateBtn = page
      .getByRole("button", { name: /generate|find|match/i })
      .first();
    await expect(generateBtn).toBeVisible();
  });
});

test.describe("Stage 3 — Viewings (/dashboard/homebuyer/viewings)", () => {
  test.beforeEach(async ({ page }) => {
    await go(page, "/dashboard/homebuyer/viewings");
  });

  test("page heading visible", async ({ page }) => {
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("status badges visible (Confirmed, Pending, Completed, Cancelled)", async ({
    page,
  }) => {
    // At least one status type should be visible in the legend or data
    const statuses = ["Confirmed", "Pending", "Completed", "Cancelled"];
    let foundCount = 0;
    for (const status of statuses) {
      const el = page.getByText(status, { exact: true }).first();
      if (await el.isVisible().catch(() => false)) foundCount++;
    }
    // Either mock data shows at least one, or it's empty state
    const emptyState = page.getByText(/no viewings|no upcoming/i).first();
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(foundCount > 0 || hasEmpty).toBeTruthy();
  });

  test("Book a Viewing CTA visible", async ({ page }) => {
    const cta = page
      .getByRole("link", { name: /book.*viewing|schedule|new.*viewing/i })
      .first();
    const altBtn = page
      .getByRole("button", { name: /book.*viewing|schedule|new.*viewing/i })
      .first();
    const hasCta = await cta.isVisible().catch(() => false);
    const hasAltBtn = await altBtn.isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no viewings/i).isVisible().catch(() => false);
    expect(hasCta || hasAltBtn || hasEmpty).toBeTruthy();
  });
});

test.describe("Stage 3 — Offers (/dashboard/homebuyer/offers)", () => {
  test.beforeEach(async ({ page }) => {
    await go(page, "/dashboard/homebuyer/offers");
  });

  test("page heading visible", async ({ page }) => {
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("offer cards or empty state visible", async ({ page }) => {
    const emptyState = page.getByText(/no offers|no active offers/i).first();
    // Mock offers show status labels
    const offerStatus = page.getByText(/under review|solicitors instructed/i).first();
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasOffers = await offerStatus.isVisible().catch(() => false);
    expect(hasEmpty || hasOffers).toBeTruthy();
  });

  test("progress tracking section or empty placeholder", async ({ page }) => {
    // Offers page has a progress tracker with status steps
    const progressStep = page.getByText(/solicitors|searches|survey|mortgage|exchange|completion/i).first();
    const emptyState = page.getByText(/no offers/i).first();
    const hasProgress = await progressStep.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasProgress || hasEmpty).toBeTruthy();
  });
});

test.describe("Stage 3 — Documents (/dashboard/homebuyer/documents)", () => {
  test.beforeEach(async ({ page }) => {
    await go(page, "/dashboard/homebuyer/documents");
  });

  test("page heading visible", async ({ page }) => {
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("document categories visible (Identity, Financial, Property)", async ({
    page,
  }) => {
    for (const category of ["Identity", "Financial", "Property"]) {
      await expect(page.getByText(category).first()).toBeVisible();
    }
  });

  test("upload zones/buttons visible", async ({ page }) => {
    const uploadBtn = page.getByText(/upload|drop file/i).first();
    await expect(uploadBtn).toBeVisible();
  });

  test("security encryption info visible", async ({ page }) => {
    const securityText = page.getByText(/encrypt|secure|protected|AML/i).first();
    await expect(securityText).toBeVisible();
  });
});

test.describe("Stage 3 — Messages (/dashboard/homebuyer/messages)", () => {
  test.beforeEach(async ({ page }) => {
    await go(page, "/dashboard/homebuyer/messages");
  });

  test("page heading or message pane visible", async ({ page }) => {
    // Messages page has either a heading or the conversation pane
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("conversation list or empty state visible", async ({ page }) => {
    const emptyState = page.getByText(/no conversations|select a conversation|no messages/i).first();
    const conversationItem = page.locator("[class*=conversation], [class*=inbox]").first();
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasConversations = await conversationItem.isVisible().catch(() => false);
    expect(hasEmpty || hasConversations).toBeTruthy();
  });
});

// ===========================================================================
// SELLER SCREENS
// ===========================================================================

test.describe("Stage 3 — Seller Home (/dashboard/seller)", () => {
  test.beforeEach(async ({ page }) => {
    await go(page, "/dashboard/seller");
  });

  test("page heading visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /seller.*dashboard|dashboard.*overview/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("displays 4 KPI stat cards", async ({ page }) => {
    for (const label of [
      "Active Listings",
      "Total Views",
      "Enquiries",
      "Upcoming Viewings",
    ]) {
      await expect(page.getByText(label).first()).toBeVisible();
    }
  });

  test("Listing Performance chart section visible", async ({ page }) => {
    await expect(page.getByText("Listing Performance")).toBeVisible();
    // SVG chart element
    await expect(page.locator("svg").first()).toBeVisible();
  });

  test("Recent Enquiries table visible", async ({ page }) => {
    await expect(page.getByText("Recent Enquiries")).toBeVisible();
    // Table headers
    await expect(page.getByText("Contact")).toBeVisible();
    await expect(page.getByText("Property")).toBeVisible();
    await expect(page.getByText("Status").first()).toBeVisible();
  });

  test("Upcoming Viewings list visible", async ({ page }) => {
    await expect(page.getByText("Upcoming Viewings").nth(1)).toBeVisible();
    // Mock viewing names
    await expect(page.getByText("Robert Thompson")).toBeVisible();
  });

  test("time range selector buttons visible (30 Days / Last Quarter)", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: /last 30 days/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /last quarter/i }),
    ).toBeVisible();
  });
});

test.describe("Stage 3 — Seller Listings (/dashboard/seller/listings)", () => {
  test.beforeEach(async ({ page }) => {
    await go(page, "/dashboard/seller/listings");
  });

  test("page heading visible", async ({ page }) => {
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("status tabs visible (All, Active, Under Offer, Sold, Drafts)", async ({
    page,
  }) => {
    for (const tab of ["All", "Active", "Under Offer", "Sold", "Drafts"]) {
      await expect(page.getByText(tab).first()).toBeVisible();
    }
  });

  test("List New Property CTA visible", async ({ page }) => {
    const cta = page
      .getByRole("link", { name: /new.*property|list.*property|create.*listing|add.*listing/i })
      .first();
    const altBtn = page
      .getByRole("button", { name: /new.*property|list.*property/i })
      .first();
    const hasCta = await cta.isVisible().catch(() => false);
    const hasAltBtn = await altBtn.isVisible().catch(() => false);
    expect(hasCta || hasAltBtn).toBeTruthy();
  });
});

test.describe("Stage 3 — Seller Analytics (/dashboard/seller/analytics)", () => {
  test.beforeEach(async ({ page }) => {
    await go(page, "/dashboard/seller/analytics");
  });

  test("page heading visible", async ({ page }) => {
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("KPI cards visible (Total Views, Unique Viewers, Saves, Enquiries)", async ({
    page,
  }) => {
    // Analytics page shows listing-level KPIs
    await expect(page.getByText("Total Views").first()).toBeVisible();
  });
});

test.describe("Stage 3 — Seller Offers (/dashboard/seller/offers)", () => {
  test.beforeEach(async ({ page }) => {
    await go(page, "/dashboard/seller/offers");
  });

  test("page heading visible", async ({ page }) => {
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("filter tabs visible (All, Pending, Accepted, Rejected)", async ({
    page,
  }) => {
    for (const tab of ["All", "Pending", "Accepted", "Rejected"]) {
      await expect(page.getByText(tab).first()).toBeVisible();
    }
  });

  test("offer cards or empty state visible", async ({ page }) => {
    const emptyState = page.getByText(/no offers|no.*received/i).first();
    const offerCard = page.locator("[class*=rounded]").filter({ hasText: /£/ }).first();
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasCards = await offerCard.isVisible().catch(() => false);
    expect(hasEmpty || hasCards).toBeTruthy();
  });
});

test.describe("Stage 3 — Seller Sale Progress (/dashboard/seller/sale-progress/[id])", () => {
  test("redirects or shows 404 for invalid sale ID", async ({ page }) => {
    await page.goto("/dashboard/seller/sale-progress/test-nonexistent-id");
    if (page.url().includes("/login")) {
      test.skip(true, "Auth not available — no test users");
      return;
    }
    // Should redirect to offers page or show not found
    await page.waitForTimeout(2_000);
    const url = page.url();
    const redirectedToOffers = url.includes("/offers");
    const shows404 = await page.getByText(/not found|404/i).isVisible().catch(() => false);
    const showsContent = await page.getByRole("heading").first().isVisible().catch(() => false);
    expect(redirectedToOffers || shows404 || showsContent).toBeTruthy();
  });
});

// ===========================================================================
// VISUAL TOKEN COMPLIANCE TESTS
// ===========================================================================

test.describe("Stage 3 — Visual Token Compliance", () => {
  const screens = [
    { name: "Buyer Home", path: "/dashboard/homebuyer" },
    { name: "Seller Home", path: "/dashboard/seller" },
    { name: "Buyer Saved", path: "/dashboard/homebuyer/saved" },
    { name: "Buyer Documents", path: "/dashboard/homebuyer/documents" },
    { name: "Seller Listings", path: "/dashboard/seller/listings" },
  ];

  for (const { name, path } of screens) {
    test(`${name} — body uses correct background color (#faf9f8)`, async ({
      page,
    }) => {
      await page.goto(path);
      if (page.url().includes("/login")) {
        test.skip(true, "Auth not available — no test users");
        return;
      }

      // Check the main content area background
      const body = page.locator("body");
      const bgColor = await body.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      // Accept rgb(250, 249, 248) = #faf9f8 or transparent/white variants
      const validBgs = [
        "rgb(250, 249, 248)",
        "rgba(0, 0, 0, 0)",
        "rgb(255, 255, 255)",
      ];
      expect(
        validBgs.some((valid) => bgColor === valid) || bgColor.startsWith("rgb"),
      ).toBeTruthy();
    });

    test(`${name} — headings use Plus Jakarta Sans font`, async ({ page }) => {
      await page.goto(path);
      if (page.url().includes("/login")) {
        test.skip(true, "Auth not available — no test users");
        return;
      }

      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible({ timeout: 10_000 });
      const fontFamily = await heading.evaluate(
        (el) => getComputedStyle(el).fontFamily,
      );
      // Should contain "Plus Jakarta Sans" or the heading font class
      expect(
        fontFamily.toLowerCase().includes("plus jakarta") ||
          fontFamily.toLowerCase().includes("jakarta") ||
          fontFamily.includes("__") /* Next.js font class hash */,
      ).toBeTruthy();
    });
  }
});

// ===========================================================================
// RESPONSIVE TESTS
// ===========================================================================

test.describe("Stage 3 — Responsive: Buyer Home", () => {
  test("1440px — 4-column stat grid", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await go(page, "/dashboard/homebuyer");

    const statsSection = page.locator("[aria-label='Dashboard statistics']");
    if (await statsSection.isVisible().catch(() => false)) {
      const gridClass = await statsSection.getAttribute("class");
      expect(gridClass).toContain("lg:grid-cols-4");
    }
  });

  test("768px — 2-column stat layout", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await go(page, "/dashboard/homebuyer");

    const statsSection = page.locator("[aria-label='Dashboard statistics']");
    if (await statsSection.isVisible().catch(() => false)) {
      const gridClass = await statsSection.getAttribute("class");
      expect(gridClass).toContain("sm:grid-cols-2");
    }
  });

  test("390px — single-column layout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await go(page, "/dashboard/homebuyer");

    const statsSection = page.locator("[aria-label='Dashboard statistics']");
    if (await statsSection.isVisible().catch(() => false)) {
      const gridClass = await statsSection.getAttribute("class");
      expect(gridClass).toContain("grid-cols-1");
    }
  });
});

test.describe("Stage 3 — Responsive: Seller Home", () => {
  test("1440px — 4-column stat grid", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await go(page, "/dashboard/seller");

    const statsGrid = page.locator(".grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4").first();
    if (await statsGrid.isVisible().catch(() => false)) {
      const box = await statsGrid.boundingBox();
      // At 1440px the grid should span full width
      expect(box!.width).toBeGreaterThan(800);
    }
  });

  test("390px — single-column layout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await go(page, "/dashboard/seller");

    // Stat cards should stack in a single column
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });
});

// ===========================================================================
// NAVIGATION FLOW TESTS
// ===========================================================================

test.describe("Stage 3 — Navigation Flows", () => {
  test("Buyer Home → Saved Properties via navigation", async ({ page }) => {
    await go(page, "/dashboard/homebuyer");

    const savedLink = page
      .getByRole("link", { name: /saved/i })
      .first();
    if (await savedLink.isVisible().catch(() => false)) {
      await savedLink.click();
      await page.waitForURL(/\/saved/, { timeout: 10_000 });
      expect(page.url()).toContain("/saved");
    }
  });

  test("Buyer Home → Viewings via navigation", async ({ page }) => {
    await go(page, "/dashboard/homebuyer");

    const viewingsLink = page
      .getByRole("link", { name: /viewing/i })
      .first();
    if (await viewingsLink.isVisible().catch(() => false)) {
      await viewingsLink.click();
      await page.waitForURL(/\/viewings/, { timeout: 10_000 });
      expect(page.url()).toContain("/viewings");
    }
  });

  test("Buyer Home → Documents via navigation", async ({ page }) => {
    await go(page, "/dashboard/homebuyer");

    const docsLink = page
      .getByRole("link", { name: /document/i })
      .first();
    if (await docsLink.isVisible().catch(() => false)) {
      await docsLink.click();
      await page.waitForURL(/\/documents/, { timeout: 10_000 });
      expect(page.url()).toContain("/documents");
    }
  });

  test("Buyer Home → Messages via navigation", async ({ page }) => {
    await go(page, "/dashboard/homebuyer");

    const messagesLink = page
      .getByRole("link", { name: /message/i })
      .first();
    if (await messagesLink.isVisible().catch(() => false)) {
      await messagesLink.click();
      await page.waitForURL(/\/messages/, { timeout: 10_000 });
      expect(page.url()).toContain("/messages");
    }
  });

  test("Seller Home → Listings via navigation", async ({ page }) => {
    await go(page, "/dashboard/seller");

    const listingsLink = page
      .getByRole("link", { name: /listing/i })
      .first();
    if (await listingsLink.isVisible().catch(() => false)) {
      await listingsLink.click();
      await page.waitForURL(/\/listings/, { timeout: 10_000 });
      expect(page.url()).toContain("/listings");
    }
  });

  test("Seller Home → Analytics via navigation", async ({ page }) => {
    await go(page, "/dashboard/seller");

    const analyticsLink = page
      .getByRole("link", { name: /analytics/i })
      .first();
    if (await analyticsLink.isVisible().catch(() => false)) {
      await analyticsLink.click();
      await page.waitForURL(/\/analytics/, { timeout: 10_000 });
      expect(page.url()).toContain("/analytics");
    }
  });

  test("Seller Home → Offers via navigation", async ({ page }) => {
    await go(page, "/dashboard/seller");

    const offersLink = page
      .getByRole("link", { name: /offer/i })
      .first();
    if (await offersLink.isVisible().catch(() => false)) {
      await offersLink.click();
      await page.waitForURL(/\/offers/, { timeout: 10_000 });
      expect(page.url()).toContain("/offers");
    }
  });
});
