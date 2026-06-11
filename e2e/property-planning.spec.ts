// e2e/property-planning.spec.ts
//
// TDD RED phase — planning applications feature (not yet implemented):
// 1. Property detail page gains a "Planning applications" h2 section
//    (server-fetched from planit.org.uk) with external links to council
//    records and an always-rendered disclaimer.
// 2. Property Details grid gains a "Planning" declaration row.
// 3. Seller listing wizard Description step gains a required
//    "Planning permission status" select.
//
// NOTE: the PlanIt fetch happens server-side in a server component, so
// page.route cannot intercept it. Assertions target structural elements
// (heading, disclaimer, empty/unavailable state) that are deterministic
// regardless of live API state.

import { test, expect } from "./fixtures/auth";
import type { Page } from "@playwright/test";
import { isAuthenticated } from "./fixtures/helpers";

// Known property with coordinates (mock dataset used when the
// search_live_data flag is off — see property-detail-service.ts).
const PROPERTY_SLUG = "12-kensington-gardens-london-sale";

/**
 * Navigate to a property detail page that has coordinates.
 * Tries the known slug first; if it 404s (live-data environments), discovers
 * a slug with coordinates via the app's own search API.
 */
async function gotoPropertyWithCoordinates(page: Page): Promise<void> {
  await page.goto(`/properties/${PROPERTY_SLUG}`);
  const isNotFound = await page
    .getByRole("heading", { name: /property not found/i })
    .isVisible()
    .catch(() => false);
  if (!isNotFound) return;

  const res = await page.request.get("/api/search?q=london");
  expect(res.ok()).toBe(true);
  const json = (await res.json()) as {
    data?: Array<{ slug?: string; coordinates?: unknown }>;
  };
  const slug = json.data?.find((row) => row.slug && row.coordinates)?.slug;
  expect(slug, "no property with coordinates available to test against").toBeTruthy();
  await page.goto(`/properties/${slug}`);
}

const PLANNING_HEADING = /planning applications/i;
const DECLARED_LABELS =
  /Permission granted|Decision pending|Refused|None known|Not declared/;

test.describe("Property page — planning applications section", () => {
  test("planning section renders with disclaimer", async ({ page }) => {
    await gotoPropertyWithCoordinates(page);

    await expect(
      page.getByRole("heading", { level: 2, name: PLANNING_HEADING }),
    ).toBeVisible();

    // Disclaimer always renders under the section, with or without live data.
    // The section streams in via <Suspense> and the server-side PlanIt fetch
    // can take up to 10s, so allow time for the stream to resolve. Scope to
    // the section: during streaming Next.js keeps a hidden template copy of
    // the resolved content at the end of <body>, which would otherwise trip
    // strict mode with a second (hidden) match.
    const heading = page.getByRole("heading", {
      level: 2,
      name: PLANNING_HEADING,
    });
    await expect(
      heading
        .locator("..")
        .getByText(/verify with the local planning authority/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("planning links open in new tab", async ({ page }) => {
    await gotoPropertyWithCoordinates(page);

    const heading = page.getByRole("heading", { level: 2, name: PLANNING_HEADING });
    await expect(heading).toBeVisible();

    // The heading's container holds the application rows (mirrors the
    // <div><h2/>…content…</div> block pattern used in PropertyDetail).
    const section = heading.locator("..");
    const links = section.locator("a");

    // Wait for the Suspense stream to resolve (server-side PlanIt fetch has a
    // 10s timeout): either application rows or the empty/unavailable state.
    await expect(
      links
        .first()
        .or(section.getByText(/no planning applications|currently unavailable/i)),
    ).toBeVisible({ timeout: 15_000 });

    const linkCount = await links.count();

    if (linkCount > 0) {
      // Live PlanIt data present — every council-record link must be safe.
      for (let i = 0; i < linkCount; i++) {
        const link = links.nth(i);
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", /noopener/);
        await expect(link).toHaveAttribute("rel", /noreferrer/);
      }
    } else {
      // No live data — the section must show its empty/unavailable state.
      await expect(
        section.getByText(/no planning applications|currently unavailable/i),
      ).toBeVisible();
    }
  });

  test("details grid shows planning declaration", async ({ page }) => {
    await gotoPropertyWithCoordinates(page);

    // The details grid is the <section> headed "Property details"
    // (label/value items — Type, Tenure, Council Tax, EPC Rating, ...).
    const detailsSection = page
      .locator("section")
      .filter({
        has: page.getByRole("heading", { level: 2, name: /property details/i }),
      })
      .first();
    await expect(detailsSection).toBeVisible();

    // The "Planning" label item must exist in the details grid.
    await expect(
      detailsSection.getByText("Planning", { exact: true }),
    ).toBeVisible();

    // Legacy properties (null declaration) show "Not declared"; otherwise
    // one of the declared status labels.
    await expect(
      detailsSection.getByText(DECLARED_LABELS).first(),
    ).toBeVisible();
  });
});

test.describe("Listing wizard — planning permission status is required", () => {
  test.use({ role: "seller" });
  test.skip(
    !isAuthenticated("e2e/.auth/seller.json"),
    'No auth state available for role "seller". Ensure test users exist in the database.',
  );

  test("listing form requires planning status", async ({
    authenticatedPage: page,
  }) => {
    // Seed a draft listing via the same APIs the wizard itself calls, so we
    // can deep-link to the Description step (step 4) deterministically.
    const createRes = await page.request.post("/api/seller/listings", {
      data: {
        postcode: "TW7 7EJ",
        address_line_1: "14 Elm Road",
        city: "Isleworth",
        property_type: "terraced",
        tenure: "freehold",
        leasehold_years_remaining: null,
      },
    });

    let listingId: string | undefined;
    if (createRes.status() === 201) {
      listingId = ((await createRes.json()) as { id: string }).id;
    } else {
      // Seller may already have a draft (e.g. a previous run) — reuse it.
      const draftsRes = await page.request.get(
        "/api/seller/listings?status=draft",
      );
      expect(draftsRes.ok()).toBe(true);
      const drafts = (await draftsRes.json()) as Array<{ id: string }>;
      listingId = drafts[0]?.id;
    }
    expect(listingId, "expected a draft listing id to seed the wizard").toBeTruthy();

    // Satisfy step 2 (bedrooms) and step 3 (>= 1 photo) gating checks so the
    // wizard allows direct navigation to step 4.
    const patchRes = await page.request.patch(
      `/api/seller/listings/${listingId}`,
      {
        data: {
          bedrooms: 3,
          bathrooms: 1,
          photos: [{ url: "https://placehold.co/800x600.jpg", order: 0 }],
        },
      },
    );
    expect(patchRes.ok()).toBe(true);

    // Planning permission status lives on step 2 (Details) with the other
    // NTSELAT material information, as a required pill group that gates the
    // Continue button.
    await page.goto(
      `/dashboard/seller/listings/create?step=2&id=${listingId}`,
    );
    if (page.url().includes("/login")) {
      test.skip(true, "Auth not available — no test users");
      return;
    }

    await expect(
      page.getByText(/planning permission status/i).first(),
    ).toBeVisible();

    // Bedrooms/bathrooms were seeded via the PATCH above, so the planning
    // declaration is the only thing blocking Continue.
    const continueButton = page.getByRole("button", { name: /^continue$/i });
    await expect(continueButton).toBeDisabled();

    // Declaring a status unblocks the step.
    await page.getByRole("button", { name: /^none known$/i }).click();
    await expect(continueButton).toBeEnabled();
  });
});
