/**
 * Referee journey — the public /reference/[token] vouch surface.
 *
 * The referee is LOGGED OUT: the single-use raw token in the URL is the sole
 * authorization. Only the token HASH is stored, so every case here seeds a row
 * with a KNOWN raw token (invite_token_hash = sha256(token)) via the
 * service-role seed helper, then drives the browser as an anonymous visitor.
 *
 * Prerequisites to run green (see e2e/README-vouching.md):
 *  - the vouching migrations applied to the target DB
 *  - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY set
 *  - a provider user (default test-provider@britestate.test) present in
 *    service_provider_details.user_id
 *  - the app running at E2E_BASE_URL
 */

import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { loadPlaywrightEnv } from "./fixtures/playwright-env";
import {
  cleanupReferencesByEmail,
  providerUserIdByEmail,
  seedReference,
} from "./fixtures/reference-seed";

loadPlaywrightEnv(process.cwd());

const PROVIDER_EMAIL = process.env.E2E_PROVIDER_EMAIL ?? "test-provider@britestate.test";

// A per-run marker scoping every seeded row's referee_email, so afterAll only
// deletes what this run created.
const RUN_ID = randomUUID().slice(0, 8);
const refereeEmail = (label: string) => `e2e-ref-${RUN_ID}-${label}@britestate.test`;

// A fresh, unguessable raw token per case (mirrors production entropy).
const rawToken = (label: string) => `e2e-${label}-${randomUUID()}${randomUUID()}`.replace(/-/g, "");

let providerId: string;

test.describe("Referee vouch journey (logged out)", () => {
  test.beforeAll(async () => {
    providerId = await providerUserIdByEmail(PROVIDER_EMAIL);
  });

  test.afterAll(async () => {
    // Clean up every row this run created (one email per seeded case).
    for (const label of ["valid-client", "valid-peer", "used", "expired", "decline"]) {
      await cleanupReferencesByEmail(refereeEmail(label)).catch(() => undefined);
    }
  });

  test("1 — valid client token shows provider name + submission form, not a login redirect", async ({
    page,
  }) => {
    const token = rawToken("validclient");
    await seedReference(providerId, refereeEmail("valid-client"), {
      token,
      referenceType: "client",
      status: "sent",
    });

    await page.goto(`/reference/${token}`);

    // NOT redirected to login — the token itself is the credential.
    expect(page.url()).not.toMatch(/\/login/);

    // Reference-request surface, with a required statement field.
    await expect(page.getByText(/reference request/i)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#reference_text")).toBeVisible();
    // Client refs require a work date.
    await expect(page.locator("#work_date")).toBeVisible();
    await expect(page.getByRole("button", { name: /submit reference/i })).toBeVisible();
  });

  test("2 — submitting a valid client reference shows the thank-you state", async ({ page }) => {
    const token = rawToken("submit");
    await seedReference(providerId, refereeEmail("valid-client"), {
      token,
      referenceType: "client",
      status: "sent",
    });

    await page.goto(`/reference/${token}`);

    await page
      .locator("#reference_text")
      .fill("They fitted a new bathroom for us last spring. Tidy, on time, excellent finish.");
    // Work date must not be in the future — pick a fixed past date.
    await page.locator("#work_date").fill("2026-01-15");
    // Optional rating: click the 5-star radio (accessible label from the form).
    await page.getByRole("radio", { name: /5 stars/i }).check();

    await page.getByRole("button", { name: /submit reference/i }).click();

    await expect(
      page.getByRole("heading", { name: /your reference has been submitted/i }),
    ).toBeVisible();
  });

  test("3 — revisiting the same token after submit shows the used/already-submitted state", async ({
    page,
  }) => {
    const token = rawToken("usedafter");
    await seedReference(providerId, refereeEmail("used"), {
      token,
      referenceType: "peer",
      status: "sent",
    });

    // First visit + submit (peer ref: statement only).
    await page.goto(`/reference/${token}`);
    await page
      .locator("#reference_text")
      .fill("I've worked alongside them on several sites. Reliable, skilled, safe to recommend.");
    await page.getByRole("button", { name: /submit reference/i }).click();
    await expect(
      page.getByRole("heading", { name: /your reference has been submitted/i }),
    ).toBeVisible();

    // Second visit of the SAME token — single-use enforced, terminal state.
    await page.goto(`/reference/${token}`);
    await expect(
      page.getByRole("heading", { name: /already been submitted/i }),
    ).toBeVisible();
    // No form on a consumed token.
    await expect(page.locator("#reference_text")).toHaveCount(0);
  });

  test("4 — an expired token shows the expired state", async ({ page }) => {
    const token = rawToken("expired");
    await seedReference(providerId, refereeEmail("expired"), {
      token,
      referenceType: "peer",
      status: "sent",
      expiresInDays: -1, // already past its window
    });

    await page.goto(`/reference/${token}`);

    await expect(page.getByRole("heading", { name: /expired/i })).toBeVisible();
    await expect(page.locator("#reference_text")).toHaveCount(0);
  });

  test("5 — a garbage/unknown token shows the generic not-valid state (no enumeration detail)", async ({
    page,
  }) => {
    await page.goto(`/reference/${rawToken("doesnotexist")}`);

    await expect(page.getByRole("heading", { name: /not valid/i })).toBeVisible();
    await expect(page.locator("#reference_text")).toHaveCount(0);
    // Generic copy must not leak whether the token was real-but-consumed.
    await expect(page.getByText(/already been submitted/i)).toHaveCount(0);
  });

  test("6 — declining a fresh token shows the declined confirmation", async ({ page }) => {
    const token = rawToken("decline");
    await seedReference(providerId, refereeEmail("decline"), {
      token,
      referenceType: "peer",
      status: "sent",
    });

    await page.goto(`/reference/${token}`);

    // Open the decline panel, add an optional reason, confirm.
    await page.getByRole("button", { name: /rather not provide a reference/i }).click();
    await page.locator("#decline_reason").fill("I no longer work with them.");
    await page.getByRole("button", { name: /confirm decline/i }).click();

    await expect(page.getByRole("heading", { name: /we won.?t ask again/i })).toBeVisible();
  });
});
