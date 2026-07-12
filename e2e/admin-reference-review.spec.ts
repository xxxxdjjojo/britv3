/**
 * Admin review journey — /admin/verifications/[userId] + the review API.
 *
 * An admin opens a provider's verification detail page, sees the references
 * panel + vouch-counts banner, and verifies / rejects a seeded 'submitted'
 * reference. A separate case proves the SERVER-SIDE authorization boundary:
 * an unauthenticated caller hitting the review API directly is rejected — not
 * merely hidden in the UI.
 *
 * Auth: reuses the existing e2e admin mechanism (the `role: "admin"` fixture,
 * which loads e2e/.auth/admin.json written by auth.setup.ts).
 *
 * Prerequisites to run green (see e2e/README-vouching.md):
 *  - the vouching migrations applied to the target DB
 *  - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY set
 *  - test-admin@britestate.test (is_admin + manage_verifications) and a provider
 *    (test-provider@britestate.test) in service_provider_details
 *  - the app running at E2E_BASE_URL
 */

import { randomUUID } from "node:crypto";
import { test, expect } from "./fixtures/auth";
import { loadPlaywrightEnv } from "./fixtures/playwright-env";
import {
  cleanupReferencesByEmail,
  providerUserIdByEmail,
  seedReference,
} from "./fixtures/reference-seed";

loadPlaywrightEnv(process.cwd());

test.use({ role: "admin" });

const PROVIDER_EMAIL = process.env.E2E_PROVIDER_EMAIL ?? "test-provider@britestate.test";

const RUN_ID = randomUUID().slice(0, 8);
const refereeEmail = (label: string) => `e2e-adminref-${RUN_ID}-${label}@britestate.test`;
const rawToken = () => randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");

let providerId: string;

test.describe("Admin reference review", () => {
  test.beforeAll(async () => {
    providerId = await providerUserIdByEmail(PROVIDER_EMAIL);
  });

  test.afterAll(async () => {
    for (const label of ["panel", "verify", "reject", "authz"]) {
      await cleanupReferencesByEmail(refereeEmail(label)).catch(() => undefined);
    }
  });

  test("1 — detail page shows the references panel + vouch-counts banner", async ({
    authenticatedPage,
  }) => {
    await seedReference(providerId, refereeEmail("panel"), {
      token: rawToken(),
      referenceType: "client",
      status: "submitted",
      referenceText: "Great work on our kitchen — reliable and tidy.",
      workDate: "2026-02-01",
      rating: 5,
    });

    await authenticatedPage.goto(`/admin/verifications/${providerId}`);

    // Vouch-counts banner (stable copy from VouchCountsBanner).
    await expect(authenticatedPage.getByText(/peer vouches/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/client vouches/i)).toBeVisible();

    // References panel with the seeded submitted row.
    await expect(
      authenticatedPage.getByRole("heading", { name: /^references/i }),
    ).toBeVisible();
    await expect(
      authenticatedPage.getByRole("button", { name: /^Verify reference from/i }).first(),
    ).toBeVisible();
  });

  test("2 — verifying a submitted reference updates its status to verified", async ({
    authenticatedPage,
  }) => {
    await seedReference(providerId, refereeEmail("verify"), {
      token: rawToken(),
      referenceType: "peer",
      status: "submitted",
      referenceText: "Worked with them for years — vouch without hesitation.",
    });

    await authenticatedPage.goto(`/admin/verifications/${providerId}`);

    // The panel confirms via a reason dialog; verify's reason is optional.
    const verifyBtn = authenticatedPage
      .getByRole("button", { name: /^Verify reference from/i })
      .first();
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();

    await authenticatedPage.getByRole("button", { name: /^confirm verify/i }).click();

    // router.refresh() re-renders the row; the status pill flips to "verified"
    // and the action buttons disappear (verified is not reviewable).
    await expect(authenticatedPage.getByText(/^verified$/i).first()).toBeVisible();
  });

  test("3 — rejecting requires a reason: empty confirm is blocked, then a reason succeeds", async ({
    authenticatedPage,
  }) => {
    await seedReference(providerId, refereeEmail("reject"), {
      token: rawToken(),
      referenceType: "peer",
      status: "submitted",
      referenceText: "Placeholder statement for a reference we will reject.",
    });

    await authenticatedPage.goto(`/admin/verifications/${providerId}`);

    const rejectBtn = authenticatedPage
      .getByRole("button", { name: /^Reject reference from/i })
      .first();
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    // With no reason typed, the confirm button is disabled — no network call.
    const confirmReject = authenticatedPage.getByRole("button", { name: /^confirm reject/i });
    await expect(confirmReject).toBeDisabled();

    // Provide a reason → confirm enables → reject succeeds.
    await authenticatedPage.getByPlaceholder(/enter a reason/i).fill("Referee could not be verified.");
    await expect(confirmReject).toBeEnabled();
    await confirmReject.click();

    await expect(authenticatedPage.getByText(/^rejected$/i).first()).toBeVisible();
  });

  test("4 — unauthenticated call to the review API is rejected (server-side authz boundary)", async ({
    request,
  }) => {
    // Seed a real submitted reference so the id is valid; the point is that even
    // a valid target id is refused without admin auth — 401/403, never 200.
    const seeded = await seedReference(providerId, refereeEmail("authz"), {
      token: rawToken(),
      referenceType: "peer",
      status: "submitted",
      referenceText: "This must never be reviewable by an anonymous caller.",
    });

    // `request` here is the top-level (unauthenticated) fixture — no admin cookies.
    const res = await request.post(`/api/admin/references/${seeded.id}/review`, {
      data: { decision: "verify" },
    });

    expect([401, 403]).toContain(res.status());
  });
});
