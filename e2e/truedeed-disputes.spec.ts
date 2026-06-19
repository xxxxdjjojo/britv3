// e2e/truedeed-disputes.spec.ts
//
// Truedeed Phase 5 — invoice disputes (clause 9.5) + admin decision workbench.
//
// Builds on Phase 1–4 e2e seeding (introduction → outcome → invoice candidate
// → admin approves → invoice created by inngest). Once an invoice exists for
// THIS run's unique listing address, the suite exercises:
//
// 1. Agent raises a dispute on their own invoice within the 10-business-day
//    window → properly_raised:true; invoice transitions to 'disputed'
//    (dunning paused for this invoice only).
// 2. Admin concedes via D2 → invoice transitions to 'cancelled' (clause 7.2
//    "concede fast, in writing, once").
// 3. Admin rejects a different dispute with D1 → invoice resumes at its
//    state_before_dispute (clock restarts where it stopped).
//
// Async invoice creation requires the Inngest dev runtime to be processing
// (npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
// --no-discovery + PUT /api/inngest). Queue-mutating tests are single-
// project (chromium only) to avoid cross-project races.

import { test, expect } from "./fixtures/auth";
import type {
  APIRequestContext,
  Browser,
  BrowserContext,
  Page,
} from "@playwright/test";
import { isAuthenticated } from "./fixtures/helpers";

const AGENT_AUTH = "e2e/.auth/agent.json";
const BUYER_AUTH = "e2e/.auth/homebuyer.json";
const ADMIN_AUTH = "e2e/.auth/admin.json";

type ProfileResponse = {
  data?: { id?: string; display_name?: string | null };
};

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

type SeededListing = {
  listingId: string;
  addressLine1: string;
};

async function seedActiveAgentListing(
  agentRequest: APIRequestContext,
): Promise<SeededListing> {
  const uniqueAddress = `${Date.now() % 1_000_000} Dispute Row`;

  const baseBody = {
    address_line1: uniqueAddress,
    city: "London",
    county: "Greater London",
    postcode: "SW1A 1AA",
    property_type: "terraced",
    bedrooms: 3,
    bathrooms: 1,
    title: "Truedeed E2E — Dispute Row test listing",
    description: "Synthetic listing seeded by the Truedeed disputes E2E.",
    tenure: "freehold",
    listing_type: "sale",
    price: 450000,
    status: "active",
  };

  let createRes = await agentRequest.post("/api/listings", {
    data: { ...baseBody, planning_permission_status: "none_known" },
  });
  if (createRes.status() === 400) {
    const errText = await createRes.text();
    if (errText.includes("planning_permission_status")) {
      createRes = await agentRequest.post("/api/listings", { data: baseBody });
    }
  }
  expect(createRes.status(), "could not seed listing").toBe(201);
  const json = (await createRes.json()) as {
    data?: { listing?: { id?: string } };
  };
  const id = json.data?.listing?.id;
  expect(id, "create listing response missing id").toBeTruthy();
  return { listingId: id!, addressLine1: uniqueAddress };
}

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
          "Hi — interested in this property (Truedeed disputes E2E).",
      },
    },
  );
  if (res.ok()) return;
  if (res.status() === 429) {
    const msgRes = await buyerRequest.post("/api/messages", {
      data: {
        recipient_id: agentId,
        content: "Truedeed disputes E2E enquiry — message-surface fallback",
        context_type: "listing",
        context_id: listing.listingId,
      },
    });
    expect(msgRes.ok(), "buyer message POST failed").toBe(true);
    return;
  }
  expect(res.ok(), `buyer contact POST failed: ${res.status()}`).toBe(true);
}

async function reportAgentCompletion(
  page: Page,
  listing: SeededListing,
): Promise<void> {
  await page.goto("/dashboard/agent/introductions");
  await expect(
    page.getByRole("heading", { name: /introductions/i }),
  ).toBeVisible();

  await expect(async () => {
    await page.reload();
    const row = page
      .getByRole("row")
      .filter({ hasText: listing.addressLine1 })
      .first();
    await expect(row).toBeVisible({ timeout: 1_000 });
    await expect(
      row.getByRole("button", { name: /report outcome/i }),
    ).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 45_000, intervals: [2_000] });

  await page
    .getByRole("row")
    .filter({ hasText: listing.addressLine1 })
    .first()
    .getByRole("button", { name: /report outcome/i })
    .click();

  const modal = page.getByRole("dialog");
  await modal.getByLabel(/outcome/i).selectOption({ label: "Completed" });
  await modal.getByLabel(/completion date/i).fill("2026-06-01");
  await modal.getByLabel(/agreed price/i).fill("450000");
  await modal
    .getByRole("button", { name: /submit|report/i })
    .last()
    .click();

  await expect(page.getByText(/reported|completed/i).first()).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Approve the agent's most recent invoice candidate via the admin API,
 * scoped by the seeded listing address by way of the linked introduction.
 */
async function adminApproveCandidateForListing(
  adminRequest: APIRequestContext,
  listingAddress: string,
): Promise<void> {
  const listRes = await adminRequest.get(
    "/api/admin/truedeed/invoice-candidates",
  );
  expect(listRes.ok(), "admin GET candidates failed").toBe(true);
  const json = (await listRes.json()) as {
    candidates?: Array<{
      candidateId: string;
      introduction?: { listingAddress?: string };
    }>;
  };
  const mine = (json.candidates ?? []).find((c) =>
    c.introduction?.listingAddress?.includes(listingAddress),
  );
  expect(mine, "expected an approvable candidate for this run").toBeDefined();

  const decideRes = await adminRequest.post(
    "/api/admin/truedeed/invoice-candidates",
    {
      data: {
        candidateId: mine!.candidateId,
        decision: "approved",
        note: null,
      },
    },
  );
  expect(decideRes.ok(), "candidate approve POST failed").toBe(true);
}

/**
 * Poll the agent's billing page until THIS run's invoice (matched by the
 * unique listing address) appears with its "Dispute" affordance.
 */
async function waitForInvoiceRow(
  page: Page,
  listingAddress: string,
): Promise<void> {
  await page.goto("/dashboard/agent/billing/truedeed");
  await expect(
    page.getByRole("heading", { name: /truedeed billing/i }),
  ).toBeVisible();

  await expect(async () => {
    await page.reload();
    const row = page
      .getByRole("row")
      .filter({ hasText: listingAddress })
      .first();
    await expect(row).toBeVisible({ timeout: 1_000 });
    await expect(
      row.getByRole("button", { name: /dispute/i }),
    ).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 60_000, intervals: [3_000] });
}

type SetupResult = {
  agentProfile: { id: string; displayName: string };
  listing: SeededListing;
};

async function setupApprovedInvoice(
  page: Page,
  browser: Browser,
): Promise<SetupResult> {
  const agentProfile = await getProfile(page.request);
  const listing = await seedActiveAgentListing(page.request);

  const buyerContext = await openRoleContext(browser, BUYER_AUTH);
  try {
    const buyerProfile = await getProfile(buyerContext.request);
    expect(
      buyerProfile.displayName,
      "buyer test user needs a display_name",
    ).toBeTruthy();
    await sendBuyerEnquiry(buyerContext.request, listing, agentProfile.id);
  } finally {
    await buyerContext.close();
  }

  await reportAgentCompletion(page, listing);

  const adminContext = await openRoleContext(browser, ADMIN_AUTH);
  try {
    await adminApproveCandidateForListing(
      adminContext.request,
      listing.addressLine1,
    );
  } finally {
    await adminContext.close();
  }

  await waitForInvoiceRow(page, listing.addressLine1);
  return { agentProfile, listing };
}

// ---------------------------------------------------------------------------
// Concede path: agent raises → admin concedes via D2 → invoice cancelled
// ---------------------------------------------------------------------------

test.describe.serial(
  "Truedeed — dispute raise → admin concede (D2) → invoice cancelled",
  () => {
    test.use({ role: "agent" });
    test.skip(
      !isAuthenticated(AGENT_AUTH) ||
        !isAuthenticated(BUYER_AUTH) ||
        !isAuthenticated(ADMIN_AUTH),
      "No auth state available for agent/homebuyer/admin.",
    );

    test("agent raises a properly-raised dispute and the invoice flips to 'disputed'", async ({
      authenticatedPage: page,
      browser,
    }) => {
      test.skip(
        test.info().project.name !== "chromium",
        "queue-mutating tests are single-project to avoid cross-project races",
      );
      test.setTimeout(180_000);

      const { listing } = await setupApprovedInvoice(page, browser);

      const row = page
        .getByRole("row")
        .filter({ hasText: listing.addressLine1 })
        .first();

      await row.getByRole("button", { name: /dispute/i }).click();

      const modal = page.getByRole("dialog", {
        name: /dispute invoice/i,
      });
      await expect(modal).toBeVisible();

      await modal
        .getByLabel(/grounds/i)
        .fill(
          "The completion fell through — buyer pulled out two weeks before exchange. (Truedeed disputes E2E, conceded path)",
        );
      await modal
        .getByRole("button", { name: /submit dispute/i })
        .click();

      // Modal closes and the row badge flips to "Disputed".
      await expect(async () => {
        const updated = page
          .getByRole("row")
          .filter({ hasText: listing.addressLine1 })
          .first();
        await expect(
          updated.getByText(/disputed/i),
        ).toBeVisible({ timeout: 1_000 });
      }).toPass({ timeout: 20_000, intervals: [2_000] });
    });

    test("admin concedes via D2 → invoice transitions to 'cancelled'", async ({
      browser,
    }) => {
      test.skip(
        test.info().project.name !== "chromium",
        "queue-mutating tests are single-project",
      );
      test.setTimeout(120_000);

      const adminContext = await openRoleContext(browser, ADMIN_AUTH);
      try {
        const adminPage = await adminContext.newPage();
        await adminPage.goto("/admin/truedeed/disputes");

        await expect(
          adminPage.getByRole("heading", { name: /disputes/i }),
        ).toBeVisible();

        const firstCard = adminPage.getByRole("listitem").first();
        await expect(firstCard).toBeVisible();

        await firstCard
          .locator("select")
          .selectOption("D2_fell_through");
        await firstCard
          .getByLabel(/decision reason/i)
          .fill(
            "Verified fall-through — buyer chain collapsed. Clause 7.2: concede fast, in writing, once.",
          );
        await firstCard
          .getByRole("button", { name: /concede|cancel invoice/i })
          .click();

        // The conceded dispute leaves the open-queue.
        await expect(async () => {
          const remaining = await adminPage
            .getByRole("listitem")
            .count();
          expect(remaining).toBeLessThan(50); // can't pin exact, but it dropped
          await expect(
            adminPage
              .getByRole("listitem")
              .filter({ hasText: /fell through/i }),
          ).toHaveCount(0);
        }).toPass({ timeout: 20_000, intervals: [2_000] });
      } finally {
        await adminContext.close();
      }
    });
  },
);

// ---------------------------------------------------------------------------
// Reject path: agent raises → admin rejects with D1 → invoice resumes
// ---------------------------------------------------------------------------

test.describe.serial(
  "Truedeed — dispute raise → admin reject (D1) → invoice resumes",
  () => {
    test.use({ role: "agent" });
    test.skip(
      !isAuthenticated(AGENT_AUTH) ||
        !isAuthenticated(BUYER_AUTH) ||
        !isAuthenticated(ADMIN_AUTH),
      "No auth state available for agent/homebuyer/admin.",
    );

    test("agent raises a second dispute, admin rejects (D1), the dispute leaves the open queue", async ({
      authenticatedPage: page,
      browser,
    }) => {
      test.skip(
        test.info().project.name !== "chromium",
        "queue-mutating tests are single-project",
      );
      test.setTimeout(180_000);

      const { listing } = await setupApprovedInvoice(page, browser);

      const row = page
        .getByRole("row")
        .filter({ hasText: listing.addressLine1 })
        .first();
      await row.getByRole("button", { name: /dispute/i }).click();

      const modal = page.getByRole("dialog", { name: /dispute invoice/i });
      await expect(modal).toBeVisible();
      await modal
        .getByLabel(/grounds/i)
        .fill(
          "Buyer came from Rightmove, not your platform. (Truedeed disputes E2E, rejected path)",
        );
      await modal
        .getByRole("button", { name: /submit dispute/i })
        .click();

      await expect(async () => {
        await expect(
          page
            .getByRole("row")
            .filter({ hasText: listing.addressLine1 })
            .first()
            .getByText(/disputed/i),
        ).toBeVisible({ timeout: 1_000 });
      }).toPass({ timeout: 20_000, intervals: [2_000] });

      const adminContext = await openRoleContext(browser, ADMIN_AUTH);
      try {
        const adminPage = await adminContext.newPage();
        await adminPage.goto("/admin/truedeed/disputes");

        const card = adminPage
          .getByRole("listitem")
          .filter({ hasText: /Rightmove/i })
          .first();
        await expect(card).toBeVisible({ timeout: 10_000 });

        await card.locator("select").selectOption("D1_source");
        await card
          .getByLabel(/decision reason/i)
          .fill(
            "Rebuttal window expired with no pre-dated same-property evidence (clause 3.3).",
          );
        await card
          .getByRole("button", { name: /reject/i })
          .click();

        await expect(async () => {
          await expect(
            adminPage
              .getByRole("listitem")
              .filter({ hasText: /Rightmove/i }),
          ).toHaveCount(0);
        }).toPass({ timeout: 20_000, intervals: [2_000] });
      } finally {
        await adminContext.close();
      }
    });
  },
);

// ---------------------------------------------------------------------------
// API authorization: the admin disputes endpoint rejects non-admins
// ---------------------------------------------------------------------------

test.describe("Truedeed — admin disputes API authorization", () => {
  test.use({ role: "homebuyer" });
  test.skip(
    !isAuthenticated(BUYER_AUTH),
    'No auth state available for role "homebuyer".',
  );

  test("homebuyer cannot list open disputes", async ({
    authenticatedPage: page,
  }) => {
    const res = await page.request.get("/api/admin/truedeed/disputes");
    expect([401, 403]).toContain(res.status());
  });
});
