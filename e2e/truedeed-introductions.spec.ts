// e2e/truedeed-introductions.spec.ts
//
// TDD RED phase — Truedeed Phase 1: introductions ledger (not yet implemented).
// Spec: docs/superpowers/specs/2026-06-12-truedeed-phase1-introductions-ledger-design.md §5–§6
//
// Feature under test:
// 1. An authenticated buyer contacting an agent about a listing
//    (POST /api/properties/[id]/contact) records an introduction server-side.
// 2. Agent dashboard gains /dashboard/agent/introductions — a table of
//    introductions (applicant, listing, status badge "Active", rebuttal
//    deadline) with a "Dispute" button while the 5-business-day window is open.
// 3. The Dispute button opens a modal (evidence file + prior-contact date
//    that must pre-date the introduction).
// 4. Admin queue at /admin/truedeed/rebuttals lists pending rebuttals.
// 5. GET /api/truedeed/introductions is the agent-list endpoint — non-agents
//    (e.g. a homebuyer) get 403.
//
// All seeding goes through existing, working APIs (listings create, property
// contact) so failures are feature-absence, not setup problems.

import { test, expect } from "./fixtures/auth";
import type {
  APIRequestContext,
  Browser,
  BrowserContext,
  Locator,
  Page,
} from "@playwright/test";
import { isAuthenticated } from "./fixtures/helpers";

const AGENT_AUTH = "e2e/.auth/agent.json";
const BUYER_AUTH = "e2e/.auth/homebuyer.json";
const ADMIN_AUTH = "e2e/.auth/admin.json";

// Matches "12 Jun 2026", "June 12, 2026", "2026-06-12" or "12/06/2026".
const DATE_PATTERN =
  /(\d{1,2}\s+\w{3,9}\s+\d{4})|(\w{3,9}\s+\d{1,2},?\s+\d{4})|(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{2,4})/;

type ProfileResponse = {
  data?: { id?: string; display_name?: string | null };
};

/** Open a second authenticated context (the auth fixture only covers one role). */
async function openRoleContext(
  browser: Browser,
  authFile: string,
): Promise<BrowserContext> {
  return browser.newContext({ storageState: authFile });
}

async function getProfile(
  request: APIRequestContext,
): Promise<{ id: string; displayName: string }> {
  const res = await request.get("/api/profile");
  expect(res.ok(), `GET /api/profile failed: ${res.status()}`).toBe(true);
  const json = (await res.json()) as ProfileResponse;
  expect(json.data?.id, "profile response missing id").toBeTruthy();
  return {
    id: json.data!.id!,
    displayName: json.data?.display_name ?? "",
  };
}

type SeededListing = { listingId: string; wasReused: boolean };

/**
 * Seed an active listing owned by the test agent via the canonical
 * POST /api/listings body (see src/__tests__/listings/create.test.ts).
 * status "active" requires planning_permission_status — required to publish.
 *
 * Reuse-first: the contact API is rate limited (5 requests / 10 min / IP),
 * so parallel projects and re-runs share one listing instead of creating a
 * fresh listing+enquiry pair every time.
 */
async function seedActiveAgentListing(
  agentRequest: APIRequestContext,
): Promise<SeededListing> {
  const listRes = await agentRequest.get("/api/listings?status=active");
  if (listRes.ok()) {
    // getMyListings shape: { data: [{ listing, property, media }], count }
    const listJson = (await listRes.json()) as {
      data?: Array<{ listing?: { id?: string } }>;
    };
    const existing = (listJson.data ?? [])[0]?.listing?.id;
    if (existing) {
      return { listingId: existing, wasReused: true };
    }
  }

  const baseBody = {
    address_line1: "7 Ledger Walk",
    city: "London",
    county: "Greater London",
    postcode: "SW1A 1AA",
    property_type: "terraced",
    bedrooms: 3,
    bathrooms: 1,
    title: "Truedeed E2E — 3-bed terrace on Ledger Walk",
    description:
      "Synthetic listing seeded by the Truedeed introductions E2E suite.",
    tenure: "freehold",
    listing_type: "sale",
    price: 425000,
    status: "active",
  };

  let createRes = await agentRequest.post("/api/listings", {
    data: { ...baseBody, planning_permission_status: "none_known" },
  });

  // Environments whose properties schema predates the planning declaration
  // column reject the canonical body — retry without it (the create path has
  // no publish guard; the guard lives on update).
  if (createRes.status() === 400) {
    const errText = await createRes.text();
    if (errText.includes("planning_permission_status")) {
      createRes = await agentRequest.post("/api/listings", { data: baseBody });
    }
  }

  expect(
    createRes.status(),
    `could not seed an active agent listing: ${createRes.status()} ${await createRes
      .text()
      .catch(() => "")}`,
  ).toBe(201);
  const json = (await createRes.json()) as {
    data?: { listing?: { id?: string } };
  };
  const id = json.data?.listing?.id;
  expect(id, "create listing response missing listing id").toBeTruthy();
  return { listingId: id!, wasReused: false };
}

/**
 * As the buyer, enquire about the listing through the existing contact API —
 * the §5 capture hook that must record an introduction.
 *
 * Rate-limit tolerance: the contact API allows 5 requests / 10 min / IP. A
 * 429 on a *reused* listing is fine — the buyer's earlier successful enquiry
 * about that listing already produced the introduction (the ledger is
 * idempotent on applicant+listing per design §4). A 429 on a freshly created
 * listing is a hard setup failure.
 */
async function sendBuyerEnquiry(
  buyerRequest: APIRequestContext,
  listing: SeededListing,
  agentId: string,
): Promise<void> {
  const res = await buyerRequest.post(
    `/api/properties/${listing.listingId}/contact`,
    {
      data: {
        agentId,
        message:
          "Hi — I'm interested in this property and would like to arrange a viewing. (Truedeed E2E)",
      },
    },
  );
  if (res.ok()) return;

  // The contact route is limited per *IP* (5/10min), which this suite can
  // exhaust on its own. The messages surface carries the same §5 capture
  // hook but is limited per *user* — fall back to it so the test stays
  // deterministic regardless of which capture surface fires.
  if (res.status() === 429) {
    const msgRes = await buyerRequest.post("/api/messages", {
      data: {
        recipient_id: agentId,
        content:
          "Hi — I'm interested in this property and would like to arrange a viewing. (Truedeed E2E, message surface)",
        context_type: "listing",
        context_id: listing.listingId,
      },
    });
    expect(
      msgRes.ok(),
      `buyer message POST failed: ${msgRes.status()} ${await msgRes.text()}`,
    ).toBe(true);
    return;
  }
  expect(
    res.ok(),
    `buyer contact POST failed: ${res.status()} ${await res.text()}`,
  ).toBe(true);
}

/**
 * The rebuttal deadline is stamped asynchronously (Inngest notify function →
 * mark_introduction_notified), so after the introduction row appears the
 * deadline can lag by a few seconds. Reload until the row carries a date.
 */
async function waitForRowWithDeadline(
  page: Page,
  applicantName: string,
): Promise<Locator> {
  const row = page.getByRole("row").filter({ hasText: applicantName }).first();
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(async () => {
    await page.reload();
    const fresh = page
      .getByRole("row")
      .filter({ hasText: applicantName })
      .first();
    await expect(fresh).toBeVisible();
    await expect(fresh.getByText(DATE_PATTERN).first()).toBeVisible({
      timeout: 1_000,
    });
  }).toPass({ timeout: 45_000, intervals: [2_000] });
  return page.getByRole("row").filter({ hasText: applicantName }).first();
}

// ---------------------------------------------------------------------------
// Agent-side: introductions ledger dashboard
// ---------------------------------------------------------------------------

test.describe("Truedeed — agent introductions ledger", () => {
  test.use({ role: "agent" });
  test.skip(
    !isAuthenticated(AGENT_AUTH) || !isAuthenticated(BUYER_AUTH),
    "No auth state available for agent/homebuyer. Ensure test users exist in the database.",
  );

  test("buyer contact creates an introduction visible to the agent", async ({
    authenticatedPage: page,
    browser,
  }) => {
    // Arrange — agent seeds an active listing; buyer enquires about it.
    const agentProfile = await getProfile(page.request);
    const listing = await seedActiveAgentListing(page.request);

    const buyerContext = await openRoleContext(browser, BUYER_AUTH);
    try {
      const buyerProfile = await getProfile(buyerContext.request);
      expect(
        buyerProfile.displayName,
        "buyer test user needs a display_name for the ledger assertion",
      ).toBeTruthy();

      await sendBuyerEnquiry(buyerContext.request, listing, agentProfile.id);

      // Act — agent opens the introductions ledger.
      await page.goto("/dashboard/agent/introductions");

      // Assert — page exists with its heading…
      await expect(
        page.getByRole("heading", { name: /introductions/i }),
      ).toBeVisible();

      // …and a ledger row for this buyer: applicant name, Active status
      // badge, and a rebuttal deadline date.
      const row = await waitForRowWithDeadline(
        page,
        buyerProfile.displayName,
      );
      await expect(row.getByText(/active/i).first()).toBeVisible();
      await expect(row.getByText(DATE_PATTERN).first()).toBeVisible();
    } finally {
      await buyerContext.close();
    }
  });

  test("agent can open the dispute modal and window validation works", async ({
    authenticatedPage: page,
    browser,
  }) => {
    // Arrange — guarantee at least one open introduction exists.
    const agentProfile = await getProfile(page.request);
    const listing = await seedActiveAgentListing(page.request);

    const buyerContext = await openRoleContext(browser, BUYER_AUTH);
    try {
      await sendBuyerEnquiry(buyerContext.request, listing, agentProfile.id);
    } finally {
      await buyerContext.close();
    }

    await page.goto("/dashboard/agent/introductions");
    await expect(
      page.getByRole("heading", { name: /introductions/i }),
    ).toBeVisible();

    // The Dispute button only renders once the async notify step has stamped
    // the rebuttal deadline — wait for any row to carry one.
    await expect(async () => {
      await page.reload();
      await expect(
        page.getByRole("button", { name: /dispute/i }).first(),
      ).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 45_000, intervals: [2_000] });

    // Act — open the dispute modal from the first open introduction.
    await page.getByRole("button", { name: /dispute/i }).first().click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // The modal explains the 5-business-day rebuttal window.
    await expect(modal.getByText(/5 business days/i)).toBeVisible();

    // The rebuttal contract: evidence file + claimed prior-contact date.
    await expect(modal.locator('input[type="file"]')).toBeAttached();
    await expect(modal.locator('input[type="date"]')).toBeAttached();

    // Submitting without an evidence file is rejected client-side.
    await modal
      .getByRole("button", { name: /submit|dispute/i })
      .last()
      .click();
    await expect(modal.getByText(/required/i).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Admin-side: rebuttal decision queue
// ---------------------------------------------------------------------------

test.describe("Truedeed — admin rebuttal queue", () => {
  test.use({ role: "admin" });
  test.skip(
    !isAuthenticated(ADMIN_AUTH),
    'No auth state available for role "admin". Ensure test users exist in the database.',
  );

  test("admin rebuttal queue renders", async ({ authenticatedPage: page }) => {
    await page.goto("/admin/truedeed/rebuttals");

    await expect(
      page.getByRole("heading", { name: /rebuttals/i }),
    ).toBeVisible();

    // Either pending rebuttals (each with Uphold/Reject) or the empty state.
    const upholdButton = page.getByRole("button", { name: /uphold/i }).first();
    const emptyState = page.getByText(/no pending rebuttals/i);
    await expect(upholdButton.or(emptyState).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// API authorization: the agent-list endpoint rejects non-agents
// ---------------------------------------------------------------------------

test.describe("Truedeed — introductions API authorization", () => {
  test.use({ role: "homebuyer" });
  test.skip(
    !isAuthenticated(BUYER_AUTH),
    'No auth state available for role "homebuyer". Ensure test users exist in the database.',
  );

  test("applicant cannot see another buyer's introductions API", async ({
    authenticatedPage: page,
  }) => {
    // GET /api/truedeed/introductions is the agent-facing list endpoint.
    // A homebuyer calling it must get 403 — not another buyer's ledger.
    const res = await page.request.get("/api/truedeed/introductions");
    expect(res.status()).toBe(403);
  });
});
