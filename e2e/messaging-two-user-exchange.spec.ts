// e2e/messaging-two-user-exchange.spec.ts
//
// Task 7 — full two-user messaging journey for the /inbox folder shell.
//
// Drives TWO authenticated contexts (landlord ↔ service_provider, an allowed
// messaging pair) through the real surfaces shipped in Tasks 1–6:
//
//   1. Exchange — landlord opens a conversation with the provider and sends a
//      message; the provider sees it in their inbox list + thread and replies;
//      the landlord sees the reply.
//   2. Archive — the landlord archives the conversation (it leaves Inbox and
//      appears in Archived) then unarchives it (it returns to Inbox).
//   3. Draft — the landlord types in the composer without sending, reloads,
//      reopens the thread → the draft is restored; sending then clears it.
//
// Seeding: conversations are seeded through the canonical POST /api/messages
// path (recipient_id → creates the conversation), exactly like the existing
// truedeed-introductions suite, so any failure is a feature bug, not a setup
// flake. All assertions wait on elements/network — no arbitrary sleeps.
//
// MIGRATION CAVEAT (read before interpreting a CI failure):
//   The Archive and Draft blocks below require the `messaging_folders`
//   migration (20260627120852) — the conversation_read_status.archived_at /
//   draft_text columns and the extended get_inbox_for_user RPC. Against a DB
//   WITHOUT that migration those columns are absent and the archive/draft
//   endpoints 500, so the folder/draft describe blocks WILL fail. That is
//   intentional: this spec documents the intended behaviour for a migrated CI
//   target. The "exchange" block only needs the conversations/messages tables
//   and passes against any messaging-enabled DB.

import { test, expect } from "./fixtures/auth";
import type {
  APIRequestContext,
  Browser,
  BrowserContext,
  Page,
} from "@playwright/test";
import { isAuthenticated } from "./fixtures/helpers";

const LANDLORD_AUTH = "e2e/.auth/landlord.json";
const PROVIDER_AUTH = "e2e/.auth/provider.json";

const HAS_AUTH = isAuthenticated(LANDLORD_AUTH) && isAuthenticated(PROVIDER_AUTH);

// A run-unique token so each test asserts on its OWN message, never a leftover
// from a previous run sharing the same two accounts on the shared dev DB.
function uniqueToken(label: string): string {
  return `${label}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

type ProfileResponse = { data?: { id?: string; display_name?: string | null } };

async function getProfile(
  request: APIRequestContext,
): Promise<{ id: string; displayName: string }> {
  const res = await request.get("/api/profile");
  expect(res.ok(), `GET /api/profile failed: ${res.status()}`).toBe(true);
  const json = (await res.json()) as ProfileResponse;
  expect(json.data?.id, "profile response missing id").toBeTruthy();
  return { id: json.data!.id!, displayName: json.data?.display_name ?? "" };
}

/** Open a second authenticated context (the auth fixture only covers one role). */
async function openRoleContext(
  browser: Browser,
  authFile: string,
): Promise<BrowserContext> {
  return browser.newContext({ storageState: authFile });
}

type SentMessage = { conversationId: string; content: string };

/**
 * Send a message via the canonical POST /api/messages. With only recipient_id
 * (no conversation_id) the service creates the conversation, so this both
 * seeds a fresh thread and posts subsequent replies. Returns the resolved
 * conversation id + the content so the caller can assert on it in the UI.
 */
async function sendMessageApi(
  request: APIRequestContext,
  recipientId: string,
  content: string,
): Promise<SentMessage> {
  const res = await request.post("/api/messages", {
    data: { recipient_id: recipientId, content, context_type: "general" },
  });
  expect(
    res.status(),
    `POST /api/messages failed: ${res.status()} ${await res.text().catch(() => "")}`,
  ).toBe(201);
  const json = (await res.json()) as {
    message?: { conversation_id?: string; content?: string };
  };
  const conversationId = json.message?.conversation_id;
  expect(conversationId, "send response missing conversation_id").toBeTruthy();
  return { conversationId: conversationId!, content };
}

/**
 * Open a specific conversation's thread. /inbox keeps the open thread in client
 * state (no URL change), but /inbox/[conversationId] deep-links the same
 * MessageThread, which is the deterministic way to land on one thread.
 */
async function openThread(page: Page, conversationId: string): Promise<void> {
  await page.goto(`/inbox/${conversationId}`);
  // Composer present == thread mounted.
  await expect(
    page.getByPlaceholder(/type a message/i),
  ).toBeVisible({ timeout: 30_000 });
}

// ---------------------------------------------------------------------------
// 1. Core exchange — landlord ↔ provider. Needs only conversations/messages.
// ---------------------------------------------------------------------------

test.describe("Messaging — two-user exchange", () => {
  test.use({ role: "landlord" });
  test.skip(
    !HAS_AUTH,
    "No auth state for landlord+provider. Run the Playwright setup with valid test users.",
  );

  test("landlord sends, provider receives + replies, landlord sees reply", async ({
    authenticatedPage: landlordPage,
    browser,
  }) => {
    const landlord = await getProfile(landlordPage.request);

    const providerCtx = await openRoleContext(browser, PROVIDER_AUTH);
    try {
      const providerPage = await providerCtx.newPage();
      const provider = await getProfile(providerCtx.request);

      // --- A: landlord sends the opening message ---------------------------
      const opening = uniqueToken("Hi from the landlord");
      const { conversationId } = await sendMessageApi(
        landlordPage.request,
        provider.id,
        opening,
      );

      // Landlord can see their own sent message in the thread.
      await openThread(landlordPage, conversationId);
      await expect(landlordPage.getByText(opening)).toBeVisible({
        timeout: 30_000,
      });

      // --- B: provider sees it in their inbox LIST + thread ----------------
      await providerPage.goto("/inbox");
      // The conversation row carries the landlord's name + last-message preview.
      const inboxRow = providerPage
        .getByRole("option")
        .filter({ hasText: opening });
      await expect(inboxRow).toBeVisible({ timeout: 30_000 });

      // Open the thread (deep-link is deterministic) and confirm the message body.
      await openThread(providerPage, conversationId);
      await expect(providerPage.getByText(opening)).toBeVisible();

      // --- B: provider replies via the composer UI -------------------------
      const reply = uniqueToken("Provider reply");
      await providerPage.getByPlaceholder(/type a message/i).fill(reply);
      await providerPage.getByRole("button", { name: /^send$/i }).click();
      // The reply renders in the provider's own thread (own bubble).
      await expect(providerPage.getByText(reply)).toBeVisible({
        timeout: 30_000,
      });

      // --- C: landlord sees the reply (realtime, else on reload) -----------
      await expect(async () => {
        await landlordPage.reload();
        await expect(landlordPage.getByText(reply)).toBeVisible({
          timeout: 2_000,
        });
      }).toPass({ timeout: 30_000, intervals: [2_000] });

      // Sanity: this is genuinely a 2-party thread (both participant ids set).
      expect(landlord.id).not.toBe(provider.id);
    } finally {
      await providerCtx.close();
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Archive folder — REQUIRES the messaging_folders migration.
// ---------------------------------------------------------------------------

test.describe("Messaging — archive folder (needs messaging_folders migration)", () => {
  test.use({ role: "landlord" });
  test.skip(
    !HAS_AUTH,
    "No auth state for landlord+provider. Run the Playwright setup with valid test users.",
  );

  test("archive removes from Inbox + shows in Archived; unarchive restores", async ({
    authenticatedPage: page,
    browser,
  }) => {
    // Seed a fresh, identifiable conversation from the provider → landlord so
    // it lands in the landlord's Inbox.
    const providerCtx = await openRoleContext(browser, PROVIDER_AUTH);
    let opening: string;
    try {
      const landlord = await getProfile(page.request);
      ({ content: opening } = await sendMessageApi(
        providerCtx.request,
        landlord.id,
        uniqueToken("Archive-me"),
      ));
    } finally {
      await providerCtx.close();
    }

    await page.goto("/inbox");
    const inboxRow = page.getByRole("option").filter({ hasText: opening });
    await expect(inboxRow).toBeVisible({ timeout: 30_000 });

    // Archive via the row's action menu.
    await inboxRow
      .getByRole("button", { name: /actions for/i })
      .click();
    await page.getByRole("menuitem", { name: /^archive$/i }).click();

    // It leaves Inbox…
    await expect(
      page.getByRole("option").filter({ hasText: opening }),
    ).toHaveCount(0, { timeout: 15_000 });

    // …and appears under the Archived folder. The folder button's accessible
    // name is the label plus an optional unread-count badge, so match loosely.
    await page.getByRole("button", { name: /archived/i }).click();
    const archivedRow = page.getByRole("option").filter({ hasText: opening });
    await expect(archivedRow).toBeVisible({ timeout: 15_000 });

    // Unarchive ("Move to inbox") restores it to Inbox.
    await archivedRow.getByRole("button", { name: /actions for/i }).click();
    await page.getByRole("menuitem", { name: /move to inbox/i }).click();
    await expect(
      page.getByRole("option").filter({ hasText: opening }),
    ).toHaveCount(0, { timeout: 15_000 });

    await page.getByRole("button", { name: /inbox/i }).first().click();
    await expect(
      page.getByRole("option").filter({ hasText: opening }),
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// 3. Draft autosave — REQUIRES the messaging_folders migration.
// ---------------------------------------------------------------------------

test.describe("Messaging — draft autosave (needs messaging_folders migration)", () => {
  test.use({ role: "landlord" });
  test.skip(
    !HAS_AUTH,
    "No auth state for landlord+provider. Run the Playwright setup with valid test users.",
  );

  test("typing without sending persists across reload; sending clears it", async ({
    authenticatedPage: page,
    browser,
  }) => {
    // A real conversation to draft into.
    const providerCtx = await openRoleContext(browser, PROVIDER_AUTH);
    let conversationId: string;
    let recipientId: string;
    try {
      const provider = await getProfile(providerCtx.request);
      recipientId = provider.id;
      ({ conversationId } = await sendMessageApi(
        page.request,
        provider.id,
        uniqueToken("Draft thread seed"),
      ));
    } finally {
      await providerCtx.close();
    }

    await openThread(page, conversationId);

    // Type a draft WITHOUT sending. The composer debounces the save (600ms) →
    // wait for the persisted draft via the API rather than a fixed sleep.
    const draftText = uniqueToken("Unsent draft");
    await page.getByPlaceholder(/type a message/i).fill(draftText);

    await expect(async () => {
      const res = await page.request.get(
        `/api/messages/${conversationId}/draft`,
      );
      expect(res.ok()).toBe(true);
      const json = (await res.json()) as { draft?: string | null };
      expect(json.draft).toBe(draftText);
    }).toPass({ timeout: 15_000, intervals: [500] });

    // Reload + reopen → the composer is re-seeded from the saved draft.
    await openThread(page, conversationId);
    await expect(page.getByPlaceholder(/type a message/i)).toHaveValue(
      draftText,
      { timeout: 15_000 },
    );

    // Sending clears the draft (composer empties + server draft is gone).
    await page.getByRole("button", { name: /^send$/i }).click();
    await expect(page.getByPlaceholder(/type a message/i)).toHaveValue("", {
      timeout: 15_000,
    });
    await expect(async () => {
      const res = await page.request.get(
        `/api/messages/${conversationId}/draft`,
      );
      expect(res.ok()).toBe(true);
      const json = (await res.json()) as { draft?: string | null };
      expect(json.draft ?? null).toBeNull();
    }).toPass({ timeout: 15_000, intervals: [500] });

    // The sent message is now in the thread.
    await expect(page.getByText(draftText)).toBeVisible({ timeout: 15_000 });
    expect(recipientId).toBeTruthy();
  });
});
