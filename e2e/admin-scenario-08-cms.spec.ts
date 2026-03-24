/**
 * Scenario 08 — CMS Content Lifecycle (20.12–20.15)
 *
 * Tests the admin CMS pages including blog, help center, and landing
 * page management with editor functionality.
 */
import { test, expect } from "./fixtures/auth";

test.use({ role: "admin" });

test.describe("Scenario 08 — CMS Content Lifecycle", () => {
  /* ---------------------------------------------------------------- */
  /*  Blog CMS                                                         */
  /* ---------------------------------------------------------------- */
  test("1 — /admin/cms/blog loads with heading", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/cms/blog", { timeout: 10_000 });
    const heading = authenticatedPage.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("2 — New Article button or link exists", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/cms/blog", { timeout: 10_000 });
    await expect(authenticatedPage.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });

    // "New Article" could be a button or a link to /admin/cms/blog/new
    const newArticleButton = authenticatedPage.getByRole("button", { name: /new article|new post|create/i });
    const newArticleLink = authenticatedPage.getByRole("link", { name: /new article|new post|create/i });

    const hasButton = await newArticleButton.first().isVisible().catch(() => false);
    const hasLink = await newArticleLink.first().isVisible().catch(() => false);

    expect(hasButton || hasLink).toBe(true);
  });

  test("3 — article list renders or empty state", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/cms/blog", { timeout: 10_000 });
    await expect(authenticatedPage.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });

    const hasArticles = await authenticatedPage
      .locator("table tbody tr, [data-testid='article-item'], .article-card, li a")
      .first()
      .isVisible()
      .catch(() => false);

    const hasEmptyState = await authenticatedPage
      .getByText(/no.*article|empty|no.*post|nothing|get started/i)
      .isVisible()
      .catch(() => false);

    expect(hasArticles || hasEmptyState).toBe(true);
  });

  /* ---------------------------------------------------------------- */
  /*  CMS Editor                                                       */
  /* ---------------------------------------------------------------- */
  test("4 — CMS editor page loads", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/cms/blog/new", { timeout: 10_000 });
    // Should load the editor page — check for any heading or form
    const heading = authenticatedPage.getByRole("heading").first();
    const hasHeading = await heading.isVisible({ timeout: 10_000 }).catch(() => false);
    const hasForm = await authenticatedPage.locator("form, input, textarea").first().isVisible().catch(() => false);
    expect(hasHeading || hasForm).toBe(true);
  });

  test("5 — editor has Title input field", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/cms/blog/new", { timeout: 10_000 });
    await authenticatedPage.locator("form, input").first().waitFor({ timeout: 10_000 }).catch(() => false);

    const titleInput =
      authenticatedPage.getByLabel(/title/i).or(
        authenticatedPage.getByPlaceholder(/title/i),
      );
    await expect(titleInput.first()).toBeVisible({ timeout: 10_000 });
  });

  test("6 — editor has Slug input field", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/cms/blog/new", { timeout: 10_000 });
    await authenticatedPage.locator("form, input").first().waitFor({ timeout: 10_000 }).catch(() => false);

    const slugInput =
      authenticatedPage.getByLabel(/slug/i).or(
        authenticatedPage.getByPlaceholder(/slug/i),
      );
    await expect(slugInput.first()).toBeVisible({ timeout: 10_000 });
  });

  test("7 — toolbar buttons for formatting (Bold, Italic, UL)", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/cms/blog/new", { timeout: 10_000 });
    await authenticatedPage.locator("form, input").first().waitFor({ timeout: 10_000 }).catch(() => false);

    // Formatting toolbar buttons: Bold ("B"), Italic ("I"), Unordered List ("UL")
    const boldButton = authenticatedPage.getByRole("button", { name: /^B$/i }).or(
      authenticatedPage.getByRole("button", { name: /bold/i }),
    );
    const italicButton = authenticatedPage.getByRole("button", { name: /^I$/i }).or(
      authenticatedPage.getByRole("button", { name: /italic/i }),
    );
    const ulButton = authenticatedPage.getByRole("button", { name: /^UL$/i }).or(
      authenticatedPage.getByRole("button", { name: /unordered|bullet|list/i }),
    );

    const hasBold = await boldButton.first().isVisible().catch(() => false);
    const hasItalic = await italicButton.first().isVisible().catch(() => false);
    const hasUL = await ulButton.first().isVisible().catch(() => false);

    // At least some formatting buttons should be present
    expect(hasBold || hasItalic || hasUL).toBe(true);
  });

  test("8 — status select (draft/published)", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/cms/blog/new", { timeout: 10_000 });
    await authenticatedPage.locator("form, input").first().waitFor({ timeout: 10_000 }).catch(() => false);

    // Status select — could be a <select>, Radix Select, or button-based selector
    const statusSelect =
      authenticatedPage.getByLabel(/status/i).or(
        authenticatedPage.getByRole("combobox", { name: /status/i }),
      ).or(
        authenticatedPage.getByText(/draft|published/i).first(),
      );

    const hasStatus = await statusSelect.first().isVisible().catch(() => false);
    expect(hasStatus).toBe(true);
  });

  test("9 — SEO sidebar: SEO Title and SEO Description fields", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/cms/blog/new", { timeout: 10_000 });
    await authenticatedPage.locator("form, input").first().waitFor({ timeout: 10_000 }).catch(() => false);

    const seoTitle =
      authenticatedPage.getByLabel(/seo title/i).or(
        authenticatedPage.getByPlaceholder(/seo title/i),
      );
    const seoDescription =
      authenticatedPage.getByLabel(/seo desc/i).or(
        authenticatedPage.getByPlaceholder(/seo desc/i),
      );

    const hasSeoTitle = await seoTitle.first().isVisible().catch(() => false);
    const hasSeoDesc = await seoDescription.first().isVisible().catch(() => false);

    expect(hasSeoTitle || hasSeoDesc).toBe(true);
  });

  test("10 — Save button exists", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/cms/blog/new", { timeout: 10_000 });
    await authenticatedPage.locator("form, input").first().waitFor({ timeout: 10_000 }).catch(() => false);

    const saveButton = authenticatedPage.getByRole("button", { name: /save|publish|submit/i });
    await expect(saveButton.first()).toBeVisible({ timeout: 10_000 });
  });

  /* ---------------------------------------------------------------- */
  /*  Help Center & Landing Pages CMS                                  */
  /* ---------------------------------------------------------------- */
  test("11 — /admin/cms/help loads with heading", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/cms/help", { timeout: 10_000 });
    const heading = authenticatedPage.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("12 — /admin/cms/landing loads with heading", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/admin/cms/landing", { timeout: 10_000 });
    const heading = authenticatedPage.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });
});
