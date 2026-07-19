# Didit Trader Identity Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the trader `id_check` manual document-upload step with a Didit hosted verification session (document OCR + passive liveness + face match), driven by `profiles.kyc_status`.

**Architecture:** A `DiditKycAdapter` implements the existing `KycProvider` seam and creates hosted sessions via the Didit REST v3 API. A signed webhook (`/api/webhooks/didit`) writes verification outcomes onto `profiles.kyc_status`/`kyc_provider_ref`; the trader stepper's `id_check` step now derives from those columns instead of the (column-drifted) `provider_documents` table. Everything stays dark until `KYC_PROVIDER=didit` is set.

**Tech Stack:** Next.js 16 App Router route handlers, Supabase (admin client for webhook writes), node:crypto HMAC, Vitest, existing `@t3-oss/env-nextjs` env schema.

**Spec:** `docs/superpowers/specs/didit-setup-decisions.md` (read it first — it has the console IDs, status mapping, and security requirements).

**Already done (do NOT redo):** Didit console setup. Workflow `3eb02ad1-491f-40b0-99d3-4d233d3561bf` (published) and webhook destination → `https://www.truedeed.co.uk/api/webhooks/didit` exist. `.env.local` has `KYC_API_KEY`, `DIDIT_WORKFLOW_ID`, and a `DIDIT_WEBHOOK_SECRET` placeholder (real value is a **user action** — copy from Didit console).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/env.ts` | Modify | Add `DIDIT_WORKFLOW_ID`, `DIDIT_WEBHOOK_SECRET` server vars |
| `.env.example` | Modify | Document the Didit vars |
| `src/services/verification/didit-status-map.ts` | Create | Didit session status → `KycStatus` mapping (shared by webhook + reconcile) |
| `src/services/verification/adapters/didit-kyc-adapter.ts` | Create | `KycProvider` impl: create hosted sessions via Didit REST |
| `src/services/verification/adapters/didit-kyc-adapter.test.ts` | Create | Adapter unit tests (fetch mocked) |
| `src/services/verification/adapters/kyc-stub-adapter.ts` | Modify | `getKycProvider()` returns Didit adapter when `KYC_PROVIDER=didit` |
| `src/lib/verification/didit-webhook-verifier.ts` | Create | Raw-body HMAC-SHA256 + timestamp verification |
| `src/lib/verification/didit-webhook-verifier.test.ts` | Create | Verifier unit tests |
| `src/app/api/webhooks/didit/route.ts` | Create | Webhook: verify → map status → update profiles |
| `src/app/api/webhooks/didit/route.test.ts` | Create | Webhook route tests |
| `src/app/api/kyc/session/route.ts` | Create | Authenticated session-start endpoint |
| `src/app/api/kyc/session/route.test.ts` | Create | Session route tests |
| `src/services/verification/kyc-reconcile.ts` | Create | On-return decision-endpoint reconciliation (webhook-lag fallback) |
| `src/services/verification/kyc-reconcile.test.ts` | Create | Reconcile tests |
| `src/services/provider/provider-verification-service.ts` | Modify | `id_check` derives from `profiles.kyc_status`; step copy |
| `src/services/provider/__tests__/provider-verification-service.test.ts` | Modify | New derivation tests |
| `src/components/dashboard/provider/StartIdCheckButton.tsx` | Create | Client button: POST /api/kyc/session → redirect |
| `src/components/dashboard/provider/StartIdCheckButton.test.tsx` | Create | Button tests |
| `src/components/dashboard/provider/VerificationStepper.tsx` | Modify | `id_check` card uses the button instead of a Link |
| `src/components/dashboard/provider/VerificationStepper.test.tsx` | Modify | Updated card assertions |
| `src/app/(protected)/dashboard/provider/verification/page.tsx` | Modify | Pass `user.id`; reconcile on `?kyc=return` |
| `src/app/(protected)/dashboard/provider/verification/credentials/page.tsx` | Modify | Remove the Identity Document upload row |

Codebase conventions that apply throughout: double quotes, semicolons, 2-space indent, trailing commas; `type` over `interface`; kebab-case service files; route tests colocated as `route.test.ts` (see `src/app/api/webhooks/resend/route.test.ts` for the house webhook-test style); NO console.log.

---

### Task 0: Worktree + branch

The shared `britv3` checkout is on someone else's branch with uncommitted changes — do not touch it. Work in a fresh worktree per house rules.

- [ ] **Step 1: Create the worktree**

```bash
cd /Users/jojominime/Documents/britv3main/britv3
git fetch origin
git worktree add ../wt-didit-kyc -b feat/didit-trader-kyc origin/main
cd ../wt-didit-kyc
pnpm install
```

Expected: worktree at `/Users/jojominime/Documents/britv3main/wt-didit-kyc` on branch `feat/didit-trader-kyc`. `pnpm install` matters — worktree node_modules symlinks break Turbopack otherwise (known gotcha).

- [ ] **Step 2: Copy env for local runs**

```bash
cp ../britv3/.env.local .env.local
```

All subsequent task paths are relative to the worktree root.

---

### Task 1: Env schema + example

**Files:**
- Modify: `src/env.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add the two server vars to `src/env.ts`**

In the `server:` block, directly under the existing `KYC_API_KEY` line (line 26):

```ts
    KYC_PROVIDER: z.enum(["stub", "stripe", "didit"]).default("stub"),
    KYC_API_KEY: z.string().min(1).optional(),
    DIDIT_WORKFLOW_ID: z.string().min(1).optional(),
    DIDIT_WEBHOOK_SECRET: z.string().min(1).optional(),
```

And in `runtimeEnv:`, under `KYC_API_KEY`:

```ts
    KYC_API_KEY: process.env.KYC_API_KEY,
    DIDIT_WORKFLOW_ID: process.env.DIDIT_WORKFLOW_ID,
    DIDIT_WEBHOOK_SECRET: process.env.DIDIT_WEBHOOK_SECRET,
```

(Optional at the schema level because the app must boot with the stub; the adapter and webhook enforce presence at use.)

- [ ] **Step 2: Document in `.env.example`**

Find the existing KYC block (search for `KYC_PROVIDER`) and extend it:

```bash
# --- Identity verification / KYC (traders) ---
# stub (default) | didit. Flip to didit only after all three vars below are set.
KYC_PROVIDER=
# Didit REST api key (console → API keys)
KYC_API_KEY=
# "Trader ID Verification (18+)" workflow id (console → Workflows)
DIDIT_WORKFLOW_ID=
# Webhook signing secret (console → Settings → Webhooks)
DIDIT_WEBHOOK_SECRET=
```

- [ ] **Step 3: Verify types + lint**

```bash
pnpm tsc --noEmit --pretty false 2>&1 | tail -5
pnpm lint 2>&1 | tail -5
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/env.ts .env.example
git commit -m "feat(kyc): add Didit workflow/webhook env vars"
```

---

### Task 2: Didit status map

**Files:**
- Create: `src/services/verification/didit-status-map.ts`

Tiny pure module; shared by the webhook route and the reconcile service. Covered by their tests — no dedicated test file.

- [ ] **Step 1: Create the module**

```ts
/**
 * Didit v3 session status → internal KycStatus.
 *
 * "Not Started" / "In Progress" map to pending (the user is mid-flow).
 * Unknown statuses map to undefined — callers must ack without writing.
 */

import type { KycStatus } from "@/services/verification/kyc-provider";

export const KYC_STATUS_BY_DIDIT_STATUS: Readonly<
  Record<string, Exclude<KycStatus, "not_started">>
> = {
  "Not Started": "pending",
  "In Progress": "pending",
  "In Review": "pending",
  Approved: "verified",
  Declined: "failed",
  Abandoned: "failed",
  Expired: "failed",
  "KYC Expired": "failed",
};

export function mapDiditStatus(
  status: string | undefined | null,
): Exclude<KycStatus, "not_started"> | undefined {
  if (!status) return undefined;
  return KYC_STATUS_BY_DIDIT_STATUS[status];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/verification/didit-status-map.ts
git commit -m "feat(kyc): map Didit session statuses to KycStatus"
```

---

### Task 3: DiditKycAdapter + provider switch

**Files:**
- Create: `src/services/verification/adapters/didit-kyc-adapter.ts`
- Modify: `src/services/verification/adapters/kyc-stub-adapter.ts`
- Test: `src/services/verification/adapters/didit-kyc-adapter.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({
  env: {
    KYC_PROVIDER: "didit",
    KYC_API_KEY: "test-api-key",
    DIDIT_WORKFLOW_ID: "wf-123",
  },
}));

import { DiditKycAdapter } from "./didit-kyc-adapter";

describe("DiditKycAdapter", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("creates a session and returns providerRef + redirectUrl", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        session_id: "sess-abc",
        url: "https://verify.didit.me/session/xyz",
      }),
    });

    const adapter = new DiditKycAdapter();
    const session = await adapter.createSession({
      userId: "user-1",
      returnUrl: "https://www.truedeed.co.uk/dashboard/provider/verification?kyc=return",
    });

    expect(session).toEqual({
      providerRef: "sess-abc",
      status: "pending",
      redirectUrl: "https://verify.didit.me/session/xyz",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://verification.didit.me/v3/session/");
    expect(init.method).toBe("POST");
    expect(init.headers["x-api-key"]).toBe("test-api-key");
    expect(JSON.parse(init.body)).toEqual({
      workflow_id: "wf-123",
      vendor_data: "user-1",
      callback: "https://www.truedeed.co.uk/dashboard/provider/verification?kyc=return",
    });
  });

  it("throws on a non-2xx response", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });

    const adapter = new DiditKycAdapter();
    await expect(
      adapter.createSession({ userId: "user-1" }),
    ).rejects.toThrow(/didit session create failed \(401\)/i);
  });

  it("throws when the response is missing session_id or url", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ session_id: "sess-abc" }),
    });

    const adapter = new DiditKycAdapter();
    await expect(
      adapter.createSession({ userId: "user-1" }),
    ).rejects.toThrow(/missing session_id\/url/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run src/services/verification/adapters/didit-kyc-adapter.test.ts
```

Expected: FAIL — cannot resolve `./didit-kyc-adapter`.

- [ ] **Step 3: Write the adapter**

`src/services/verification/adapters/didit-kyc-adapter.ts`:

```ts
/**
 * Didit KYC adapter — creates hosted identity-verification sessions via the
 * Didit REST v3 API. Server-only (uses the secret api key).
 *
 * vendor_data carries our userId so webhook events can be correlated back to
 * the profile; callback is where Didit redirects the user afterwards.
 */

import { env } from "@/env";
import type {
  KycProvider,
  KycSession,
  KycSessionRequest,
} from "@/services/verification/kyc-provider";

const DIDIT_SESSION_URL = "https://verification.didit.me/v3/session/";

type DiditSessionResponse = Readonly<{
  session_id?: string;
  url?: string;
}>;

export class DiditKycAdapter implements KycProvider {
  readonly name = "didit";

  async createSession(req: KycSessionRequest): Promise<KycSession> {
    const apiKey = env.KYC_API_KEY;
    const workflowId = env.DIDIT_WORKFLOW_ID;
    if (!apiKey || !workflowId) {
      throw new Error(
        "Didit KYC is not configured (KYC_API_KEY / DIDIT_WORKFLOW_ID missing)",
      );
    }

    const res = await fetch(DIDIT_SESSION_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        vendor_data: req.userId,
        ...(req.returnUrl ? { callback: req.returnUrl } : {}),
      }),
    });

    if (!res.ok) {
      throw new Error(`Didit session create failed (${res.status})`);
    }

    const data = (await res.json()) as DiditSessionResponse;
    if (!data.session_id || !data.url) {
      throw new Error("Didit session response missing session_id/url");
    }

    return {
      providerRef: data.session_id,
      status: "pending",
      redirectUrl: data.url,
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run src/services/verification/adapters/didit-kyc-adapter.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Wire the provider switch**

In `src/services/verification/adapters/kyc-stub-adapter.ts`, replace the bottom of the file (the `_provider` cache + `getKycProvider`) with:

```ts
import { env } from "@/env";
import { DiditKycAdapter } from "@/services/verification/adapters/didit-kyc-adapter";
```

(imports go at the top of the file with the existing import)

```ts
let _provider: KycProvider | null = null;

/** Resolve the active KYC provider from KYC_PROVIDER (stub is the default). */
export function getKycProvider(): KycProvider {
  if (_provider) return _provider;
  _provider = env.KYC_PROVIDER === "didit" ? new DiditKycAdapter() : new StubKycAdapter();
  return _provider;
}

/** Test-only: clear the memoized provider. */
export function _resetKycProviderForTests(): void {
  _provider = null;
}
```

- [ ] **Step 6: Verify nothing else broke, then commit**

```bash
pnpm vitest run src/services/verification
git add src/services/verification/adapters/
git commit -m "feat(kyc): Didit adapter creates hosted verification sessions"
```

---

### Task 4: Webhook signature verifier

**Files:**
- Create: `src/lib/verification/didit-webhook-verifier.ts`
- Test: `src/lib/verification/didit-webhook-verifier.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyDiditWebhook } from "./didit-webhook-verifier";

const SECRET = "whsec_test";
const NOW = 1_800_000_000; // fixed clock for determinism

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

describe("verifyDiditWebhook", () => {
  const body = JSON.stringify({ session_id: "sess-1", status: "Approved" });

  it("accepts a valid signature with a fresh timestamp", () => {
    expect(
      verifyDiditWebhook(body, sign(body), String(NOW), SECRET, NOW),
    ).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(
      verifyDiditWebhook(body + "x", sign(body), String(NOW), SECRET, NOW),
    ).toBe(false);
  });

  it("rejects a wrong-length signature without throwing", () => {
    expect(verifyDiditWebhook(body, "abc123", String(NOW), SECRET, NOW)).toBe(false);
  });

  it("rejects a stale timestamp (> 5 minutes skew)", () => {
    expect(
      verifyDiditWebhook(body, sign(body), String(NOW - 301), SECRET, NOW),
    ).toBe(false);
  });

  it("rejects missing signature or timestamp", () => {
    expect(verifyDiditWebhook(body, null, String(NOW), SECRET, NOW)).toBe(false);
    expect(verifyDiditWebhook(body, sign(body), null, SECRET, NOW)).toBe(false);
    expect(verifyDiditWebhook(body, sign(body), "not-a-number", SECRET, NOW)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run src/lib/verification/didit-webhook-verifier.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the verifier**

```ts
/**
 * Didit webhook verification: HMAC-SHA256 (hex) of the RAW request body with
 * the webhook signing secret, plus timestamp freshness (5-minute window).
 * Constant-time comparison; never throws on malformed input.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_SKEW_SECONDS = 300;

export function verifyDiditWebhook(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!signature || !timestamp) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > MAX_SKEW_SECONDS) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run src/lib/verification/didit-webhook-verifier.test.ts
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/verification/
git commit -m "feat(kyc): Didit webhook HMAC verifier"
```

---

### Task 5: Webhook route `/api/webhooks/didit`

**Files:**
- Create: `src/app/api/webhooks/didit/route.ts`
- Test: `src/app/api/webhooks/didit/route.test.ts`

Read `src/app/api/webhooks/resend/route.test.ts` first and mirror its mocking style where it differs from below.

- [ ] **Step 1: Write the failing tests**

```ts
import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "whsec_test";

vi.mock("@/env", () => ({
  env: { DIDIT_WEBHOOK_SECRET: "whsec_test" },
}));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

import { POST } from "./route";

function makeUpdateResult(matchedRows: number) {
  // update().eq("id",..).eq("kyc_provider_ref",..).select("id") resolves with data rows
  const second = vi.fn().mockReturnValue({
    select: vi.fn().mockResolvedValue({
      data: Array.from({ length: matchedRows }, (_, i) => ({ id: `row-${i}` })),
      error: null,
    }),
  });
  const first = vi.fn().mockReturnValue({ eq: second });
  return { update: vi.fn().mockReturnValue({ eq: first }) };
}

function signedRequest(payload: object, overrides?: { signature?: string; timestamp?: string }) {
  const raw = JSON.stringify(payload);
  const timestamp = overrides?.timestamp ?? String(Math.floor(Date.now() / 1000));
  const signature =
    overrides?.signature ?? createHmac("sha256", SECRET).update(raw).digest("hex");
  return new Request("http://localhost/api/webhooks/didit", {
    method: "POST",
    body: raw,
    headers: { "x-signature": signature, "x-timestamp": timestamp },
  });
}

describe("POST /api/webhooks/didit", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("401s on a bad signature without touching the database", async () => {
    const res = await POST(
      signedRequest({ session_id: "s1", status: "Approved" }, { signature: "bad" }),
    );
    expect(res.status).toBe(401);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("writes verified for an Approved session matched by vendor_data + session id", async () => {
    fromMock.mockReturnValue(makeUpdateResult(1));

    const res = await POST(
      signedRequest({ session_id: "s1", status: "Approved", vendor_data: "user-1" }),
    );

    expect(res.status).toBe(200);
    expect(fromMock).toHaveBeenCalledWith("profiles");
    const updateArg = fromMock.mock.results[0].value.update.mock.calls[0][0];
    expect(updateArg).toEqual({ kyc_status: "verified" });
  });

  it("writes failed for a Declined session", async () => {
    fromMock.mockReturnValue(makeUpdateResult(1));

    const res = await POST(
      signedRequest({ session_id: "s1", status: "Declined", vendor_data: "user-1" }),
    );

    expect(res.status).toBe(200);
    const updateArg = fromMock.mock.results[0].value.update.mock.calls[0][0];
    expect(updateArg).toEqual({ kyc_status: "failed" });
  });

  it("acks (200, no write) when the status is unknown", async () => {
    const res = await POST(
      signedRequest({ session_id: "s1", status: "SomethingNew", vendor_data: "user-1" }),
    );
    expect(res.status).toBe(200);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("acks (200) when no profile matches the session", async () => {
    fromMock.mockReturnValue(makeUpdateResult(0));

    const res = await POST(
      signedRequest({ session_id: "stale", status: "Approved", vendor_data: "user-1" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matched).toBe(false);
  });

  it("500s when the database write fails (so Didit redelivers)", async () => {
    const second = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
    });
    const first = vi.fn().mockReturnValue({ eq: second });
    fromMock.mockReturnValue({ update: vi.fn().mockReturnValue({ eq: first }) });

    const res = await POST(
      signedRequest({ session_id: "s1", status: "Approved", vendor_data: "user-1" }),
    );
    expect(res.status).toBe(500);
  });

  it("400s when the payload has no session_id", async () => {
    const res = await POST(signedRequest({ status: "Approved" }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run src/app/api/webhooks/didit/route.test.ts
```

Expected: FAIL — `./route` not found.

- [ ] **Step 3: Write the route**

```ts
/**
 * POST /api/webhooks/didit
 *
 * Didit verification webhooks (status.updated / data.updated). Unauthenticated
 * — trust comes solely from the HMAC signature over the RAW body, verified
 * BEFORE any parsing or DB access (401 on mismatch, 500 when the secret is
 * unset so a misconfigured deploy is loud).
 *
 * Writes are absolute-state and scoped to the profile whose kyc_provider_ref
 * equals this event's session_id — replays and events for superseded sessions
 * match zero rows and are acked without effect (idempotency). Unknown
 * statuses/sessions are acked with 200 so Didit does not retry; DB failures
 * return 500 so it does.
 */

import { NextResponse } from "next/server";
import { env } from "@/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyDiditWebhook } from "@/lib/verification/didit-webhook-verifier";
import { mapDiditStatus } from "@/services/verification/didit-status-map";

export const dynamic = "force-dynamic";

type DiditWebhookPayload = Readonly<{
  session_id?: string;
  status?: string;
  vendor_data?: string;
}>;

export async function POST(request: Request) {
  const secret = env.DIDIT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const isValid = verifyDiditWebhook(
    rawBody,
    request.headers.get("x-signature"),
    request.headers.get("x-timestamp"),
    secret,
  );
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: DiditWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as DiditWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const sessionId = payload.session_id;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const kycStatus = mapDiditStatus(payload.status);
  if (!kycStatus) {
    // Unknown status — ack so Didit doesn't retry.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("profiles")
    .update({ kyc_status: kycStatus })
    .eq("kyc_provider_ref", sessionId);
  if (payload.vendor_data) {
    query = query.eq("id", payload.vendor_data);
  }
  const { data, error } = await query.select("id");

  if (error) {
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json(
    { received: true, matched: (data ?? []).length > 0 },
    { status: 200 },
  );
}
```

NOTE for the implementer: the mock in Step 1 assumes the chain
`update().eq().eq().select()`. Supabase's real builder supports exactly that
(filters chain after update; `select()` at the end returns the updated rows).
If `vendor_data` is absent only one `.eq` runs — the "no session_id" and
unmatched tests cover the shape. Adjust mocks (not the route) if chain order
differs when you run the tests.

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run src/app/api/webhooks/didit/route.test.ts
```

Expected: 7 passed. If a chain-shape mismatch fails a test, fix the MOCK to match the real builder semantics described above, keeping the assertions.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/webhooks/didit/
git commit -m "feat(kyc): Didit webhook route updates profiles.kyc_status"
```

---

### Task 6: Session-start route `/api/kyc/session`

**Files:**
- Create: `src/app/api/kyc/session/route.ts`
- Test: `src/app/api/kyc/session/route.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const profileMaybeSingle = vi.fn();
const userClient = {
  auth: { getUser: getUserMock },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: profileMaybeSingle }),
    }),
  }),
};
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => userClient,
}));

const adminUpdateEq = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: adminUpdateEq }),
    }),
  }),
}));

const createSessionMock = vi.fn();
vi.mock("@/services/verification/adapters/kyc-stub-adapter", () => ({
  getKycProvider: () => ({ name: "mock", createSession: createSessionMock }),
}));

import { POST } from "./route";

function makeRequest() {
  return new Request("http://localhost/api/kyc/session", { method: "POST" });
}

describe("POST /api/kyc/session", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    profileMaybeSingle.mockReset();
    createSessionMock.mockReset();
    adminUpdateEq.mockReset();
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email: "t@example.com" } },
    });
    profileMaybeSingle.mockResolvedValue({ data: { kyc_status: "not_started" }, error: null });
    adminUpdateEq.mockResolvedValue({ error: null });
  });

  it("401s when unauthenticated", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("409s when already verified", async () => {
    profileMaybeSingle.mockResolvedValue({ data: { kyc_status: "verified" }, error: null });
    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("409s when the provider has no hosted flow (stub)", async () => {
    createSessionMock.mockResolvedValue({
      providerRef: "stub_user-1",
      status: "not_started",
      redirectUrl: null,
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
  });

  it("creates a session, persists pending + ref, and returns the redirect URL", async () => {
    createSessionMock.mockResolvedValue({
      providerRef: "sess-abc",
      status: "pending",
      redirectUrl: "https://verify.didit.me/session/xyz",
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirectUrl).toBe("https://verify.didit.me/session/xyz");

    expect(createSessionMock).toHaveBeenCalledWith({
      userId: "user-1",
      email: "t@example.com",
      returnUrl: "http://localhost/dashboard/provider/verification?kyc=return",
    });
    expect(adminUpdateEq).toHaveBeenCalledWith("id", "user-1");
  });

  it("502s when the provider errors", async () => {
    createSessionMock.mockRejectedValue(new Error("didit down"));
    const res = await POST(makeRequest());
    expect(res.status).toBe(502);
  });

  it("500s when persisting the ref fails", async () => {
    createSessionMock.mockResolvedValue({
      providerRef: "sess-abc",
      status: "pending",
      redirectUrl: "https://verify.didit.me/session/xyz",
    });
    adminUpdateEq.mockResolvedValue({ error: { message: "boom" } });
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run src/app/api/kyc/session/route.test.ts
```

Expected: FAIL — `./route` not found.

- [ ] **Step 3: Write the route**

```ts
/**
 * POST /api/kyc/session
 *
 * Starts an identity-verification session for the signed-in trader and
 * returns the hosted redirect URL. Persists kyc_status='pending' +
 * kyc_provider_ref BEFORE returning so the webhook can correlate.
 *
 * 409 when already verified or when the active provider has no hosted flow
 * (stub — the safe dark-launch default). Rate-limited per user because each
 * session costs money.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getKycProvider } from "@/services/verification/adapters/kyc-stub-adapter";
import { createInMemoryRateLimiter } from "@/lib/rate-limit-memory";

export const dynamic = "force-dynamic";

const SESSIONS_PER_HOUR = 5;
const limiter = createInMemoryRateLimiter(SESSIONS_PER_HOUR, 3_600_000);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { success } = await limiter.limit(`kyc-session:${user.id}`);
  if (!success) {
    return NextResponse.json({ error: "Too many attempts — try again later" }, { status: 429 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("kyc_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.kyc_status === "verified") {
    return NextResponse.json({ error: "Identity already verified" }, { status: 409 });
  }

  const origin = new URL(request.url).origin;
  let session;
  try {
    session = await getKycProvider().createSession({
      userId: user.id,
      email: user.email,
      returnUrl: `${origin}/dashboard/provider/verification?kyc=return`,
    });
  } catch {
    return NextResponse.json(
      { error: "Verification service unavailable" },
      { status: 502 },
    );
  }

  if (!session.redirectUrl) {
    return NextResponse.json(
      { error: "Identity verification is not available yet" },
      { status: 409 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ kyc_status: "pending", kyc_provider_ref: session.providerRef })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not start verification" }, { status: 500 });
  }

  return NextResponse.json({ redirectUrl: session.redirectUrl });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run src/app/api/kyc/session/route.test.ts
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/kyc/
git commit -m "feat(kyc): session-start endpoint returns Didit hosted URL"
```

---

### Task 7: Reconcile-on-return service

**Files:**
- Create: `src/services/verification/kyc-reconcile.ts`
- Test: `src/services/verification/kyc-reconcile.test.ts`

Covers webhook lag/misses: when the trader lands back on the verification page still `pending`, ask Didit's decision endpoint directly.

- [ ] **Step 1: Write the failing tests**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({
  env: { KYC_PROVIDER: "didit", KYC_API_KEY: "test-api-key" },
}));

const maybeSingleMock = vi.fn();
const updateSecondEq = vi.fn().mockResolvedValue({ error: null });
const updateFirstEq = vi.fn().mockReturnValue({ eq: updateSecondEq });
const updateMock = vi.fn().mockReturnValue({ eq: updateFirstEq });
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock }),
      }),
      update: updateMock,
    }),
  }),
}));

import { reconcilePendingKyc } from "./kyc-reconcile";

describe("reconcilePendingKyc", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    maybeSingleMock.mockReset();
    updateMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("does nothing when the profile is not pending", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { kyc_status: "verified", kyc_provider_ref: "sess-1" },
      error: null,
    });
    await reconcilePendingKyc("user-1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("updates the profile when the decision is Approved", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { kyc_status: "pending", kyc_provider_ref: "sess-1" },
      error: null,
    });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: "Approved" }) });

    await reconcilePendingKyc("user-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://verification.didit.me/v3/session/sess-1/decision/",
      { headers: { "x-api-key": "test-api-key" } },
    );
    expect(updateMock).toHaveBeenCalledWith({ kyc_status: "verified" });
  });

  it("leaves pending untouched when the decision is still In Review", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { kyc_status: "pending", kyc_provider_ref: "sess-1" },
      error: null,
    });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: "In Review" }) });

    await reconcilePendingKyc("user-1");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("swallows fetch failures (webhook remains source of truth)", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { kyc_status: "pending", kyc_provider_ref: "sess-1" },
      error: null,
    });
    fetchMock.mockRejectedValue(new Error("network"));

    await expect(reconcilePendingKyc("user-1")).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run src/services/verification/kyc-reconcile.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the service**

```ts
/**
 * Webhook-lag fallback: when a trader returns from the Didit hosted flow and
 * their profile is still 'pending', fetch the session decision directly and
 * apply a terminal outcome. The webhook remains the primary writer — this
 * only closes the gap for the user staring at the page. Errors are swallowed:
 * a failed reconcile just means the page shows "under review" until the
 * webhook lands.
 */

import { env } from "@/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapDiditStatus } from "@/services/verification/didit-status-map";

const DECISION_URL = (sessionId: string) =>
  `https://verification.didit.me/v3/session/${sessionId}/decision/`;

export async function reconcilePendingKyc(userId: string): Promise<void> {
  if (env.KYC_PROVIDER !== "didit" || !env.KYC_API_KEY) return;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("kyc_status, kyc_provider_ref")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.kyc_status !== "pending" || !profile.kyc_provider_ref) {
    return;
  }

  try {
    const res = await fetch(DECISION_URL(profile.kyc_provider_ref), {
      headers: { "x-api-key": env.KYC_API_KEY },
    });
    if (!res.ok) return;

    const decision = (await res.json()) as { status?: string };
    const mapped = mapDiditStatus(decision.status);
    if (!mapped || mapped === "pending") return;

    await admin
      .from("profiles")
      .update({ kyc_status: mapped })
      .eq("id", userId)
      .eq("kyc_provider_ref", profile.kyc_provider_ref);
  } catch {
    // Swallow — the webhook is the source of truth.
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run src/services/verification/kyc-reconcile.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/services/verification/kyc-reconcile.ts src/services/verification/kyc-reconcile.test.ts
git commit -m "feat(kyc): reconcile pending sessions on return from Didit"
```

---

### Task 8: `id_check` derives from `profiles.kyc_status`

**Files:**
- Modify: `src/services/provider/provider-verification-service.ts`
- Test: `src/services/provider/__tests__/provider-verification-service.test.ts`

Context for the implementer: the `provider_documents` query in this service selects columns that don't exist on the live table (known column drift), so `id_check` currently always reads "not_started". We are NOT fixing that table — `id_check` simply stops using it. Insurance/qualifications keep their existing (broken-as-before) derivation; do not touch their logic.

- [ ] **Step 1: Read the existing test file**

```bash
sed -n 1,80p src/services/provider/__tests__/provider-verification-service.test.ts
```

Match its mocking style for the additions below (adapt mock construction, keep the assertions).

- [ ] **Step 2: Add failing tests for the new derivation**

Append to `src/services/provider/__tests__/provider-verification-service.test.ts` (adapting the supabase mock helper to whatever the file already uses — the key requirement is `from("profiles").select("kyc_status").eq("id", …).maybeSingle()` resolving to a controllable value):

```ts
describe("getVerificationSteps — id_check from profiles.kyc_status", () => {
  function fakeSupabaseWithKyc(kycStatus: string | null) {
    return {
      from: (table: string) => ({
        select: () => ({
          eq: () => {
            if (table === "profiles") {
              return {
                maybeSingle: async () => ({
                  data: kycStatus === null ? null : { kyc_status: kycStatus },
                  error: null,
                }),
              };
            }
            return Promise.resolve({ data: [], error: null });
          },
        }),
      }),
    } as unknown as SupabaseClient;
  }

  it.each([
    ["not_started", "not_started"],
    ["pending", "submitted"],
    ["verified", "approved"],
    ["failed", "rejected"],
  ] as const)("kyc_status %s → step status %s", async (kycStatus, expected) => {
    const steps = await getVerificationSteps("user-1", fakeSupabaseWithKyc(kycStatus));
    const idCheck = steps.find((s) => s.stepId === "id_check");
    expect(idCheck?.status).toBe(expected);
  });

  it("treats a missing profile row as not_started", async () => {
    const steps = await getVerificationSteps("user-1", fakeSupabaseWithKyc(null));
    expect(steps.find((s) => s.stepId === "id_check")?.status).toBe("not_started");
  });

  it("sets a rejection reason when kyc failed", async () => {
    const steps = await getVerificationSteps("user-1", fakeSupabaseWithKyc("failed"));
    const idCheck = steps.find((s) => s.stepId === "id_check");
    expect(idCheck?.rejectionReason).toMatch(/not successful/i);
  });
});
```

- [ ] **Step 3: Run to verify the new tests fail**

```bash
pnpm vitest run src/services/provider/__tests__/provider-verification-service.test.ts
```

Expected: the new cases FAIL (id_check derived from documents → "not_started" for all).

- [ ] **Step 4: Implement**

In `src/services/provider/provider-verification-service.ts`:

(a) Replace the `id_check` entry in `VERIFICATION_STEPS` (drop `document_types`):

```ts
  {
    stepId: "id_check",
    label: "Identity Verification",
    description:
      "Verify your identity with a quick document + selfie check — takes about 2 minutes.",
    required: true,
  },
```

(b) Add the mapping above `getVerificationSteps`:

```ts
/** profiles.kyc_status → id_check step status. */
const STEP_STATUS_BY_KYC_STATUS: Record<string, VerificationStep["status"]> = {
  not_started: "not_started",
  pending: "submitted",
  verified: "approved",
  failed: "rejected",
};

const KYC_REJECTION_REASON =
  "Identity verification was not successful. Please try again.";
```

(c) In `getVerificationSteps`, add a third query to the `Promise.allSettled` array:

```ts
      supabase
        .from("profiles")
        .select("kyc_status")
        .eq("id", providerId)
        .maybeSingle(),
```

destructure it as `kycResult`, and resolve it:

```ts
    const kycStatus: string =
      kycResult.status === "fulfilled" && !kycResult.value.error
        ? ((kycResult.value.data as { kyc_status?: string } | null)?.kyc_status ??
          "not_started")
        : "not_started";
```

(d) In the `VERIFICATION_STEPS.map` callback, handle `id_check` FIRST (before the `"document_types" in step` branch):

```ts
      if (step.stepId === "id_check") {
        status = STEP_STATUS_BY_KYC_STATUS[kycStatus] ?? "not_started";
        if (status === "rejected") rejectionReason = KYC_REJECTION_REASON;
      } else if ("document_types" in step) {
        // ... existing document branch unchanged ...
      } else {
        // ... existing reference branch unchanged ...
      }
```

The function's first parameter is semantically the auth user id now (it always was at runtime — the `service_provider_details.id` fallback in callers never matched). Leave the parameter name as-is to keep the diff minimal.

- [ ] **Step 5: Run the full service test file**

```bash
pnpm vitest run src/services/provider/__tests__/provider-verification-service.test.ts
```

Expected: ALL pass — new cases AND pre-existing ones. If a pre-existing test asserted `id_check` behaviour from documents, update THAT test to the new contract (the spec changed) and note it in the commit body.

- [ ] **Step 6: Commit**

```bash
git add src/services/provider/
git commit -m "feat(kyc): derive id_check step from profiles.kyc_status"
```

---

### Task 9: Stepper UI — StartIdCheckButton

**Files:**
- Create: `src/components/dashboard/provider/StartIdCheckButton.tsx`
- Create: `src/components/dashboard/provider/StartIdCheckButton.test.tsx`
- Modify: `src/components/dashboard/provider/VerificationStepper.tsx`
- Modify: `src/components/dashboard/provider/VerificationStepper.test.tsx`

- [ ] **Step 1: Write the failing button tests**

`src/components/dashboard/provider/StartIdCheckButton.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StartIdCheckButton } from "./StartIdCheckButton";

describe("StartIdCheckButton", () => {
  const fetchMock = vi.fn();
  const assignMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    // window.location.assign is not writable in jsdom — replace location
    Object.defineProperty(window, "location", {
      value: { ...window.location, assign: assignMock },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    assignMock.mockReset();
  });

  it("starts a session and redirects to the hosted URL", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ redirectUrl: "https://verify.didit.me/session/xyz" }),
    });

    render(<StartIdCheckButton label="Get started" />);
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("https://verify.didit.me/session/xyz");
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/kyc/session", { method: "POST" });
  });

  it("shows the API error message when the request fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Identity verification is not available yet" }),
    });

    render(<StartIdCheckButton label="Get started" />);
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    expect(
      await screen.findByText(/not available yet/i),
    ).toBeInTheDocument();
    expect(assignMock).not.toHaveBeenCalled();
  });

  it("shows a generic error when fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("network"));

    render(<StartIdCheckButton label="Get started" />);
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    expect(
      await screen.findByText(/unavailable right now/i),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm vitest run src/components/dashboard/provider/StartIdCheckButton.test.tsx
```

Expected: FAIL — component not found.

- [ ] **Step 3: Write the component**

`src/components/dashboard/provider/StartIdCheckButton.tsx`:

```tsx
"use client";

import { useState } from "react";

type StartIdCheckButtonProps = Readonly<{
  /** Action label, e.g. "Get started" / "Re-apply". */
  label: string;
}>;

/**
 * id_check step action: starts a hosted identity-verification session and
 * redirects the trader to it. Styled to match the stepper's Link actions.
 */
export function StartIdCheckButton({ label }: StartIdCheckButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kyc/session", { method: "POST" });
      const data = (await res.json()) as { redirectUrl?: string; error?: string };
      if (!res.ok || !data.redirectUrl) {
        setError(data.error ?? "Verification is unavailable right now.");
        return;
      }
      window.location.assign(data.redirectUrl);
    } catch {
      setError("Verification is unavailable right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.08em] text-brand-primary transition-colors hover:text-brand-primary-dark disabled:opacity-50"
      >
        {isLoading ? "Starting…" : `${label} →`}
      </button>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify the button tests pass**

```bash
pnpm vitest run src/components/dashboard/provider/StartIdCheckButton.test.tsx
```

Expected: 3 passed.

- [ ] **Step 5: Wire it into the stepper**

In `src/components/dashboard/provider/VerificationStepper.tsx`:

Add the import:

```tsx
import { StartIdCheckButton } from "./StartIdCheckButton";
```

Replace the "Action links" block (currently `{actionLabel && (…)}`) with:

```tsx
            {/* Action links */}
            {actionLabel && (
              <div className="mt-auto flex items-center gap-3 pt-1">
                {step.stepId === "id_check" ? (
                  <StartIdCheckButton label={actionLabel} />
                ) : (
                  <Link
                    href={href}
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.08em] text-brand-primary transition-colors hover:text-brand-primary-dark"
                  >
                    {actionLabel} &rarr;
                  </Link>
                )}
                {step.status === "rejected" && (
                  <Link
                    href="/help?topic=verification"
                    className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-600"
                  >
                    Contact Support
                  </Link>
                )}
              </div>
            )}
```

Also remove the now-dead `id_check` entry from `STEP_LINKS` (it no longer routes anywhere).

- [ ] **Step 6: Update the stepper test**

In `src/components/dashboard/provider/VerificationStepper.test.tsx`, add (matching the file's existing render/step-fixture helpers):

```tsx
it("renders a session-start button (not a link) for the id_check step", () => {
  render(
    <VerificationStepper
      steps={[
        {
          stepId: "id_check",
          label: "Identity Verification",
          description: "Verify your identity",
          status: "not_started",
          required: true,
          updatedAt: null,
          step_number: 1,
          rejectionReason: null,
        },
      ]}
    />,
  );

  expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /get started/i })).not.toBeInTheDocument();
});
```

If existing tests assert an `id_check` link to `/dashboard/provider/verification/credentials`, update them to expect the button (contract change).

- [ ] **Step 7: Run both component test files**

```bash
pnpm vitest run src/components/dashboard/provider/StartIdCheckButton.test.tsx src/components/dashboard/provider/VerificationStepper.test.tsx
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/dashboard/provider/
git commit -m "feat(kyc): id_check card launches Didit hosted session"
```

---

### Task 10: Verification page + credentials page

**Files:**
- Modify: `src/app/(protected)/dashboard/provider/verification/page.tsx`
- Modify: `src/app/(protected)/dashboard/provider/verification/credentials/page.tsx`

Server-component edits; covered by the service/component tests above plus manual verification in Task 11. No new test file (house style: pages are thin composition).

- [ ] **Step 1: Reconcile on return + pass user.id**

In `src/app/(protected)/dashboard/provider/verification/page.tsx`:

Add the import:

```tsx
import { reconcilePendingKyc } from "@/services/verification/kyc-reconcile";
```

Change the page signature to accept search params (Next 16: async searchParams):

```tsx
export default async function VerificationOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ kyc?: string }>;
}) {
```

After the `if (!user) redirect("/login");` guard, add:

```tsx
  const { kyc } = await searchParams;
  if (kyc === "return") {
    // Trader just came back from the hosted flow — close any webhook gap
    // before rendering the steps.
    await reconcilePendingKyc(user.id);
  }
```

And change the steps fetch to pass the auth user id (the `service_provider_details.id` fallback never matched — that table has no `id` column):

```tsx
  const [steps, badges] = await Promise.all([
    getVerificationSteps(user.id, supabase),
    getProviderBadges(supabase, providerId).catch(() => []),
  ]);
```

(Keep `providerId` and its query — badges still use it.)

- [ ] **Step 2: Drop the identity upload row**

In `src/app/(protected)/dashboard/provider/verification/credentials/page.tsx`, remove this line from `DOCUMENT_CONFIGS`:

```tsx
  { type: "identity_proof", label: "Identity Document" },
```

(Identity is now verified via the hosted Didit flow; DBS and trade credentials remain uploads.)

- [ ] **Step 3: Type-check + lint**

```bash
pnpm tsc --noEmit --pretty false 2>&1 | tail -5
pnpm lint 2>&1 | tail -5
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/dashboard/provider/verification/"
git commit -m "feat(kyc): verification page reconciles Didit return; drop identity upload row"
```

---

### Task 11: Full gates + manual verification

- [ ] **Step 1: Full test suite**

```bash
pnpm test 2>&1 | tail -20
```

Expected: 0 failures. A failing file anywhere in `src/__tests__` (guard layer: route contracts, nav parity, link integrity) is YOUR bug — fix before proceeding. Do NOT run build and the test suite concurrently (CPU starvation causes spurious failures — known gotcha).

- [ ] **Step 2: Lint + build (sequential)**

```bash
pnpm lint
pnpm build
```

Expected: lint 0 errors; build exit 0. The build takes 30–42 min — do not kill it early; the real error (if any) follows "Running TypeScript".

- [ ] **Step 3: Manual smoke (dev server, stub mode)**

```bash
pnpm dev
```

Log in as a provider (`test-provider@britestate.test` / `TestPassword123!`), open `/dashboard/provider/verification`:
- `id_check` card shows the new copy + "Get started" button.
- Clicking it shows "Identity verification is not available yet" (KYC_PROVIDER unset → stub → 409). That is the correct dark-launch behaviour.
- Credentials page no longer shows an "Identity Document" upload.

- [ ] **Step 4: Manual smoke (didit mode, real session)**

Set `KYC_PROVIDER=didit` in the worktree `.env.local`, restart dev, click "Get started": you must land on `https://verify.didit.me/…`. Check the profile row flipped to pending:
the card should now read "Under review — no action needed" after returning.
Then unset `KYC_PROVIDER` again (keep the repo dark until rollout).

- [ ] **Step 5: Commit any fixes, push, open PR**

```bash
git push -u origin feat/didit-trader-kyc
gh pr create --title "feat(kyc): Didit hosted identity verification for traders" --body "$(cat <<'EOF'
## Summary
- Replaces the trader id_check manual upload with a Didit hosted verification session (OCR + passive liveness + face match)
- New: DiditKycAdapter (KycProvider seam), POST /api/kyc/session, signed webhook /api/webhooks/didit, on-return reconcile
- id_check step now derives from profiles.kyc_status (kyc_scaffold columns); identity upload row removed from credentials page
- Dark until KYC_PROVIDER=didit is set (stub 409s and the UI degrades gracefully)

Spec: docs/superpowers/specs/didit-setup-decisions.md

## Test plan
- [ ] Unit: adapter, webhook verifier, webhook route, session route, reconcile, step derivation, stepper button
- [ ] pnpm test / lint / build green
- [ ] Manual: stub-mode 409 + didit-mode hosted redirect verified locally
EOF
)"
```

---

## Rollout (after merge — mostly user actions)

1. **User:** copy the real webhook signing secret from Didit console → Settings → Webhooks into `britv3/.env.local` AND Vercel env (`DIDIT_WEBHOOK_SECRET`).
2. **User:** add `DIDIT_WORKFLOW_ID=3eb02ad1-491f-40b0-99d3-4d233d3561bf`, `KYC_API_KEY` to Vercel env.
3. Verify prod `profiles` has `kyc_status`/`kyc_provider_ref` (kyc_scaffold migration `20260619120002`) — if missing, `db push` it per `supabase/migrations/README.md`.
4. Set `KYC_PROVIDER=didit` in Vercel → redeploy → live. Rollback = unset it.
5. **User:** rotate `KYC_API_KEY` (current value was flagged TEMP) — console → API keys, update env, redeploy.
