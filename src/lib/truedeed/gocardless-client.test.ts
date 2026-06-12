/**
 * Tests for truedeed/gocardless-client (TDD RED — module not yet implemented)
 *
 * Pins the contract of @/lib/truedeed/gocardless-client per
 * docs/truedeed/billing-flow-gocardless.md §1. Hand-rolled REST client —
 * NO SDK. All fetch traffic is mocked (vi.stubGlobal) and env is stubbed
 * (vi.stubEnv); no real network, synthetic tokens/secrets only.
 *
 *  - isGoCardlessConfigured(): GOCARDLESS_ACCESS_TOKEN present
 *  - gcRequest(path, init?):
 *      base https://api-sandbox.gocardless.com when
 *      GOCARDLESS_ENVIRONMENT !== 'live', https://api.gocardless.com when live;
 *      headers: Authorization Bearer, 'GoCardless-Version': '2015-07-06',
 *      Idempotency-Key only when given; body passed through as JSON
 *      (envelope is the caller's concern); non-2xx → throws Error carrying
 *      status + parsed GC error message; missing token → GoCardlessConfigError
 *  - createBillingRequestFlow(): two-step — POST /billing_requests with
 *      { billing_requests: { mandate_request: { scheme: 'bacs' } } }, then
 *      POST /billing_request_flows linking it with redirect_uri / exit_uri /
 *      prefilled_customer.email → { flowId, authorisationUrl }
 *  - verifyGoCardlessWebhook(rawBody, signatureHeader, secret):
 *      timing-safe HMAC-SHA256 hex comparison vs the Webhook-Signature header
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";

import {
  GoCardlessConfigError,
  isGoCardlessConfigured,
  gcRequest,
  createBillingRequestFlow,
  verifyGoCardlessWebhook,
} from "@/lib/truedeed/gocardless-client";

// ---------------------------------------------------------------------------
// Fixtures & helpers
// ---------------------------------------------------------------------------

const TEST_TOKEN = "sandbox_test_token_abc123"; // synthetic — not a real credential
const SANDBOX_BASE = "https://api-sandbox.gocardless.com";
const LIVE_BASE = "https://api.gocardless.com";
const GC_VERSION = "2015-07-06";

const fetchMock = vi.fn();

/** JSON Response helper for the mocked GoCardless API. */
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Normalise whatever headers shape the client passed into a Headers object. */
const headersOfCall = (callIndex = 0): Headers =>
  new Headers(
    (fetchMock.mock.calls[callIndex]?.[1] as RequestInit | undefined)?.headers,
  );

const urlOfCall = (callIndex = 0): string =>
  String(fetchMock.mock.calls[callIndex]?.[0]);

const bodyOfCall = (callIndex = 0): unknown =>
  JSON.parse(
    String((fetchMock.mock.calls[callIndex]?.[1] as RequestInit).body),
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GOCARDLESS_ACCESS_TOKEN", TEST_TOKEN);
  vi.stubEnv("GOCARDLESS_ENVIRONMENT", "sandbox");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// 1. Configuration
// ---------------------------------------------------------------------------

describe("isGoCardlessConfigured", () => {
  it("returns true when GOCARDLESS_ACCESS_TOKEN is present", () => {
    // Act + Assert
    expect(isGoCardlessConfigured()).toBe(true);
  });

  it("returns false when GOCARDLESS_ACCESS_TOKEN is absent", () => {
    // Arrange
    vi.stubEnv("GOCARDLESS_ACCESS_TOKEN", "");

    // Act + Assert
    expect(isGoCardlessConfigured()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. gcRequest — base URL, headers, body, errors
// ---------------------------------------------------------------------------

describe("gcRequest", () => {
  it("throws GoCardlessConfigError when the access token is missing", async () => {
    // Arrange
    vi.stubEnv("GOCARDLESS_ACCESS_TOKEN", "");

    // Act + Assert
    await expect(gcRequest("/customers")).rejects.toBeInstanceOf(
      GoCardlessConfigError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("targets the sandbox base URL when GOCARDLESS_ENVIRONMENT !== 'live'", async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse({ customers: [] }));

    // Act
    await gcRequest("/customers");

    // Assert
    expect(urlOfCall()).toBe(`${SANDBOX_BASE}/customers`);
  });

  it("targets the live base URL when GOCARDLESS_ENVIRONMENT === 'live'", async () => {
    // Arrange
    vi.stubEnv("GOCARDLESS_ENVIRONMENT", "live");
    fetchMock.mockResolvedValue(jsonResponse({ customers: [] }));

    // Act
    await gcRequest("/customers");

    // Assert
    expect(urlOfCall()).toBe(`${LIVE_BASE}/customers`);
  });

  it("sends Authorization Bearer and the pinned GoCardless-Version header", async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse({ customers: [] }));

    // Act
    await gcRequest("/customers");

    // Assert
    const headers = headersOfCall();
    expect(headers.get("authorization")).toBe(`Bearer ${TEST_TOKEN}`);
    expect(headers.get("gocardless-version")).toBe(GC_VERSION);
  });

  it("sends Idempotency-Key when given, omits it otherwise", async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse({ payments: {} }));

    // Act
    await gcRequest("/payments", {
      method: "POST",
      body: { payments: {} },
      idempotencyKey: "invoice-TD-2026-0147",
    });
    await gcRequest("/payments", { method: "POST", body: { payments: {} } });

    // Assert
    expect(headersOfCall(0).get("idempotency-key")).toBe(
      "invoice-TD-2026-0147",
    );
    expect(headersOfCall(1).get("idempotency-key")).toBeNull();
  });

  it("passes the caller's body through as JSON unchanged (envelope is caller's concern)", async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse({ payments: {} }));
    const envelope = {
      payments: { amount: 29880, currency: "GBP", links: { mandate: "MD123" } },
    };

    // Act
    await gcRequest("/payments", { method: "POST", body: envelope });

    // Assert
    const call = fetchMock.mock.calls[0][1] as RequestInit;
    expect(call.method).toBe("POST");
    expect(bodyOfCall()).toEqual(envelope);
  });

  it("returns the parsed JSON body on 2xx", async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      jsonResponse({ payments: { id: "PM123", status: "pending_submission" } }),
    );

    // Act
    const result = await gcRequest<{ payments: { id: string } }>(
      "/payments/PM123",
    );

    // Assert
    expect(result.payments.id).toBe("PM123");
  });

  it("throws on non-2xx, carrying the status and the parsed GC error message", async () => {
    // Arrange — GoCardless 422 validation error envelope
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            message: "Validation failed",
            type: "validation_failed",
            code: 422,
            errors: [{ field: "currency", message: "is invalid" }],
          },
        },
        422,
      ),
    );

    // Act
    const failure = gcRequest("/payments", {
      method: "POST",
      body: { payments: {} },
    });

    // Assert
    await expect(failure).rejects.toThrow(/Validation failed/);
    await expect(
      gcRequest("/payments", { method: "POST", body: { payments: {} } }),
    ).rejects.toMatchObject({ status: 422 });
  });
});

// ---------------------------------------------------------------------------
// 3. createBillingRequestFlow — two-step mandate setup
// ---------------------------------------------------------------------------

describe("createBillingRequestFlow", () => {
  const INPUT = {
    customerEmail: "director@example-agency.co.uk",
    orgId: "org-42",
    redirectUri: "https://truedeed.co.uk/onboarding/mandate/complete",
    exitUri: "https://truedeed.co.uk/onboarding/mandate/exit",
  };

  beforeEach(() => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ billing_requests: { id: "BRQ123" } }, 201),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            billing_request_flows: {
              id: "BRF456",
              authorisation_url: "https://pay.gocardless.com/flow/BRF456",
            },
          },
          201,
        ),
      );
  });

  it("step 1: POSTs /billing_requests with a bacs mandate_request envelope", async () => {
    // Act
    await createBillingRequestFlow(INPUT);

    // Assert
    expect(urlOfCall(0)).toBe(`${SANDBOX_BASE}/billing_requests`);
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("POST");
    expect(bodyOfCall(0)).toMatchObject({
      billing_requests: { mandate_request: { scheme: "bacs" } },
    });
  });

  it("step 2: POSTs /billing_request_flows linking the billing request, with redirect/exit/prefilled email", async () => {
    // Act
    await createBillingRequestFlow(INPUT);

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(urlOfCall(1)).toBe(`${SANDBOX_BASE}/billing_request_flows`);
    expect(bodyOfCall(1)).toMatchObject({
      billing_request_flows: {
        links: { billing_request: "BRQ123" },
        redirect_uri: INPUT.redirectUri,
        exit_uri: INPUT.exitUri,
        prefilled_customer: { email: INPUT.customerEmail },
      },
    });
  });

  it("returns the flow id and authorisation_url for the hosted page redirect", async () => {
    // Act
    const result = await createBillingRequestFlow(INPUT);

    // Assert
    expect(result).toEqual({
      flowId: "BRF456",
      authorisationUrl: "https://pay.gocardless.com/flow/BRF456",
    });
  });
});

// ---------------------------------------------------------------------------
// 4. verifyGoCardlessWebhook — HMAC-SHA256, timing-safe
// ---------------------------------------------------------------------------

describe("verifyGoCardlessWebhook", () => {
  // Synthetic body + secret; the expected signature is computed here in the
  // test with node:crypto, independent of the implementation.
  const RAW_BODY = JSON.stringify({
    events: [{ id: "EV123", resource_type: "payments", action: "confirmed" }],
  });
  const SECRET = "synthetic-webhook-secret"; // test-only value
  const VALID_SIGNATURE = createHmac("sha256", SECRET)
    .update(RAW_BODY)
    .digest("hex");

  it("returns true for the correct HMAC-SHA256 hex signature", () => {
    // Act + Assert
    expect(verifyGoCardlessWebhook(RAW_BODY, VALID_SIGNATURE, SECRET)).toBe(
      true,
    );
  });

  it("returns false for a wrong signature", () => {
    // Arrange — same length as a real digest, different content
    const wrong = "0".repeat(VALID_SIGNATURE.length);

    // Act + Assert
    expect(verifyGoCardlessWebhook(RAW_BODY, wrong, SECRET)).toBe(false);
  });

  it("returns false when the Webhook-Signature header is null", () => {
    // Act + Assert
    expect(verifyGoCardlessWebhook(RAW_BODY, null, SECRET)).toBe(false);
  });

  it("returns false when the body was tampered with after signing", () => {
    // Arrange
    const tampered = RAW_BODY.replace("confirmed", "failed");

    // Act + Assert
    expect(verifyGoCardlessWebhook(tampered, VALID_SIGNATURE, SECRET)).toBe(
      false,
    );
  });
});
