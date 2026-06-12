// e2e/truedeed-outcomes.spec.ts
//
// TDD RED phase — Truedeed Phase 2: outcome reporting + invoice candidates
// (not yet implemented). Builds on Phase 1's introductions ledger
// (e2e/truedeed-introductions.spec.ts) and reuses its seeding approach.
//
// Feature under test:
// 1. The agent introductions ledger gains a "Report outcome" affordance per
//    row, opening a modal (Outcome select; Completed reveals completion date
//    + agreed price). Reporting "Completed" synchronously creates an invoice
//    candidate.
// 2. Admin queue at /admin/truedeed/invoice-candidates lists candidates with
//    one-screen evidence, the £249 fee, and Approve / Reject controls.
//    Reject requires a note; Approve resolves the card.
// 3. GET /api/admin/truedeed/invoice-candidates is admin-only — a homebuyer
//    gets 401/403.
//
// All seeding goes through existing, working APIs (listings create, property
// contact with the /api/messages fallback) so failures are feature-absence,
// not setup problems.

import { test, expect } from "./fixtures/auth";
import type {
  APIRequestContext,
  Browser,
  BrowserContext,
} from "@playwright/test";
import { isAuthenticated } from "./fixtures/helpers";

const AGENT_AUTH = "e2e/.auth/agent.json";
const BUYER_AUTH = "e2e/.auth/homebuyer.json";
const ADMIN_AUTH = "e2e/.auth/admin.json";

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
 * POST /api/listings body — reuse-first, same as the Phase 1 suite, because
 * the contact API is rate limited (5 requests / 10 min / IP).
 */
async function seedActiveAgentListing(
  agentRequest: APIRequestContext,
): Promise<SeededListing> {
  const listRes = await agentRequest.get("/api/listings?status=active");
  if (listRes.ok()) {
    const listJson = (await listRes.json()) as {
      data?: Array<{ listing?: { id?: string } }>;
    };
    const existing = (listJson.data ?? [])[0]?.listing?.id;
    if (existing) {
      return { listingId: existing, wasReused: true };
    }
  }

  const baseBody = {
    address_line1: "9 Outcome Row",
    city: "London",
    county: "Greater London",
    postcode: "SW1A 1AA",
    property_type: "terraced",
    bedrooms: 3,
    bathrooms: 1,
    title: "Truedeed E2E — 3-bed terrace on Outcome Row",
    description:
      "Synthetic listing seeded by the Truedeed outcomes E2E suite.",
    tenure: "freehold",
    listing_type: "sale",
    price: 450000,
    status: "active",
  };

  let createRes = await agentRequest.post("/api/listings", {
    data: { ...baseBody, planning_permission_status: "none_known" },
  });

  // Environments whose properties schema predates the planning declaration
  // column reject the canonical body — retry without it.
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
 * the introduction-capture hook. Falls back to POST /api/messages on a 429
 * (the contact route is limited per IP; the messages surface per user).
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
          "Hi — I'm interested in this property and would like to arrange a viewing. (Truedeed outcomes E2E)",
      },
    },
  );
  if (res.ok()) return;

  if (res.status() === 429) {
    const msgRes = await buyerRequest.post("/api/messages", {
      data: {
        recipient_id: agentId,
        content:
          "Hi — I'm interested in this property and would like to arrange a viewing. (Truedeed outcomes E2E, message surface)",
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

// ---------------------------------------------------------------------------
// Agent reports an outcome → admin invoice-candidate queue
// ---------------------------------------------------------------------------
//
// Serial: test 1 seeds the candidate the later admin-queue tests act on.
// The reject-note test runs before the approve test because Approve resolves
// (removes) the card.

test.describe.serial("Truedeed — outcome reporting and invoice candidates", () => {
  test.use({ role: "agent" });
  test.skip(
    !isAuthenticated(AGENT_AUTH) ||
      !isAuthenticated(BUYER_AUTH) ||
      !isAuthenticated(ADMIN_AUTH),
    "No auth state available for agent/homebuyer/admin. Ensure test users exist in the database.",
  );

  test("agent reports a completion and an invoice candidate reaches the admin queue", async ({
    authenticatedPage: page,
    browser,
  }) => {
    // Arrange — agent seeds an active listing; buyer enquires (introduction).
    const agentProfile = await getProfile(page.request);
    const listing = await seedActiveAgentListing(page.request);

    const buyerContext = await openRoleContext(browser, BUYER_AUTH);
    let buyerDisplayName = "";
    try {
      const buyerProfile = await getProfile(buyerContext.request);
      expect(
        buyerProfile.displayName,
        "buyer test user needs a display_name for the queue assertion",
      ).toBeTruthy();
      buyerDisplayName = buyerProfile.displayName;

      await sendBuyerEnquiry(buyerContext.request, listing, agentProfile.id);
    } finally {
      await buyerContext.close();
    }

    // Act — agent opens the ledger and reports the outcome on the row.
    await page.goto("/dashboard/agent/introductions");
    await expect(
      page.getByRole("heading", { name: /introductions/i }),
    ).toBeVisible();

    // The introduction row is written synchronously but can lag a reload —
    // poll until the row carries its Report outcome affordance.
    await expect(async () => {
      await page.reload();
      const row = page
        .getByRole("row")
        .filter({ hasText: buyerDisplayName })
        .first();
      await expect(row).toBeVisible({ timeout: 1_000 });
      await expect(
        row.getByRole("button", { name: /report outcome/i }),
      ).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 45_000, intervals: [2_000] });

    await page
      .getByRole("row")
      .filter({ hasText: buyerDisplayName })
      .first()
      .getByRole("button", { name: /report outcome/i })
      .click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // Completed outcome: completion date + agreed price (pounds).
    await modal.getByLabel(/outcome/i).selectOption({ label: "Completed" });
    await modal.getByLabel(/completion date/i).fill("2026-06-01");
    await modal.getByLabel(/agreed price/i).fill("450000");
    await modal
      .getByRole("button", { name: /submit|report/i })
      .last()
      .click();

    // Assert — confirmation toast or the row flipping to Completed.
    const confirmation = page.getByText(/reported/i).first();
    const completedRow = page
      .getByRole("row")
      .filter({ hasText: buyerDisplayName })
      .first()
      .getByText(/completed/i)
      .first();
    await expect(confirmation.or(completedRow).first()).toBeVisible({
      timeout: 15_000,
    });

    // …and the candidate appears immediately in the admin queue.
    const adminContext = await openRoleContext(browser, ADMIN_AUTH);
    try {
      const adminPage = await adminContext.newPage();
      await adminPage.goto("/admin/truedeed/invoice-candidates");

      await expect(
        adminPage.getByRole("heading", { name: /invoice candidates/i }),
      ).toBeVisible();

      await expect(
        adminPage.getByText(buyerDisplayName).first(),
      ).toBeVisible();
      await expect(adminPage.getByText(/£249/).first()).toBeVisible();
      await expect(
        adminPage.getByRole("button", { name: /approve/i }).first(),
      ).toBeVisible();
    } finally {
      await adminContext.close();
    }
  });

  test("reject requires a note", async ({ browser }) => {
    // Arrange — the previous test left a pending candidate in the queue.
    const adminContext = await openRoleContext(browser, ADMIN_AUTH);
    try {
      const adminPage = await adminContext.newPage();
      await adminPage.goto("/admin/truedeed/invoice-candidates");
      await expect(
        adminPage.getByRole("heading", { name: /invoice candidates/i }),
      ).toBeVisible();

      // Act — Reject without filling a note.
      await adminPage
        .getByRole("button", { name: /reject/i })
        .first()
        .click();

      // Assert
      await expect(adminPage.getByText(/note is required/i)).toBeVisible();
    } finally {
      await adminContext.close();
    }
  });

  test("admin approve flow", async ({ browser }) => {
    // Arrange
    const adminContext = await openRoleContext(browser, ADMIN_AUTH);
    try {
      const adminPage = await adminContext.newPage();
      await adminPage.goto("/admin/truedeed/invoice-candidates");
      await expect(
        adminPage.getByRole("heading", { name: /invoice candidates/i }),
      ).toBeVisible();

      const approveButtons = adminPage.getByRole("button", {
        name: /approve/i,
      });
      const pendingBefore = await approveButtons.count();
      expect(
        pendingBefore,
        "expected at least one pending candidate (seeded by the report test)",
      ).toBeGreaterThan(0);

      // Act — approve the first card.
      await approveButtons.first().click();

      // Assert — the card disappears or flips to an approved state.
      await expect(async () => {
        const remaining = await approveButtons.count();
        const approvedVisible = await adminPage
          .getByText(/approved/i)
          .first()
          .isVisible()
          .catch(() => false);
        expect(remaining < pendingBefore || approvedVisible).toBe(true);
      }).toPass({ timeout: 15_000, intervals: [1_000] });
    } finally {
      await adminContext.close();
    }
  });
});

// ---------------------------------------------------------------------------
// API authorization: the admin candidates endpoint rejects non-admins
// ---------------------------------------------------------------------------

test.describe("Truedeed — invoice candidates API authorization", () => {
  test.use({ role: "homebuyer" });
  test.skip(
    !isAuthenticated(BUYER_AUTH),
    'No auth state available for role "homebuyer". Ensure test users exist in the database.',
  );

  test("buyer cannot list invoice candidates", async ({
    authenticatedPage: page,
  }) => {
    const res = await page.request.get(
      "/api/admin/truedeed/invoice-candidates",
    );
    expect([401, 403]).toContain(res.status());
  });
});
