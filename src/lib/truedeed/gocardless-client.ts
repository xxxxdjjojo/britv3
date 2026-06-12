/**
 * Truedeed GoCardless REST client (billing spec §1).
 *
 * Hand-rolled fetch client — NO SDK. Sandbox by default; live only when
 * GOCARDLESS_ENVIRONMENT === 'live'. Pinned API version 2015-07-06.
 * Request/response envelopes ({ billing_requests: … } etc.) are the
 * caller's concern; gcRequest passes bodies through as JSON unchanged.
 *
 * Consumed by the billing services and the GoCardless webhook route
 * (mandate lifecycle, payment creation, dunning reinstatement).
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const SANDBOX_BASE_URL = "https://api-sandbox.gocardless.com";
const LIVE_BASE_URL = "https://api.gocardless.com";
const GC_API_VERSION = "2015-07-06";

/** Thrown when GoCardless env configuration is missing (no access token). */
export class GoCardlessConfigError extends Error {
  constructor(message = "GOCARDLESS_ACCESS_TOKEN is not configured") {
    super(message);
    this.name = "GoCardlessConfigError";
  }
}

/** Thrown on a non-2xx GoCardless response, carrying the HTTP status. */
export class GoCardlessApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GoCardlessApiError";
    this.status = status;
  }
}

/** True when the GOCARDLESS_ACCESS_TOKEN env var is present and non-empty. */
export function isGoCardlessConfigured(): boolean {
  return Boolean(process.env.GOCARDLESS_ACCESS_TOKEN);
}

function baseUrl(): string {
  return process.env.GOCARDLESS_ENVIRONMENT === "live"
    ? LIVE_BASE_URL
    : SANDBOX_BASE_URL;
}

/** Options for {@link gcRequest}. Body is the full GC envelope, pre-wrapped. */
export type GcRequestInit = {
  method?: string;
  /** Caller-supplied envelope, serialised as JSON unchanged (spec §1). */
  body?: unknown;
  /** Sent as the Idempotency-Key header only when given. */
  idempotencyKey?: string;
};

/** Shape of the GoCardless error envelope on non-2xx responses. */
type GcErrorBody = {
  error?: { message?: string };
};

/**
 * Perform an authenticated request against the GoCardless API (spec §1).
 *
 * - Base URL: sandbox unless GOCARDLESS_ENVIRONMENT === 'live'.
 * - Headers: Authorization Bearer + pinned 'GoCardless-Version: 2015-07-06';
 *   Idempotency-Key only when provided.
 * - 2xx → parsed JSON body; non-2xx → GoCardlessApiError carrying the status
 *   and the parsed GC error message.
 *
 * @throws GoCardlessConfigError before any network call when the token is
 *   missing.
 */
export async function gcRequest<T = unknown>(
  path: string,
  init: GcRequestInit = {},
): Promise<T> {
  const token = process.env.GOCARDLESS_ACCESS_TOKEN;
  if (!token) {
    throw new GoCardlessConfigError();
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "GoCardless-Version": GC_API_VERSION,
    "Content-Type": "application/json",
  };
  if (init.idempotencyKey) {
    headers["Idempotency-Key"] = init.idempotencyKey;
  }

  const response = await fetch(`${baseUrl()}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  // Clone before reading: leaves the original body unconsumed, so retries
  // (and mocked fetches that resolve the same Response twice) stay safe.
  const parsed: unknown = await response.clone().json();
  if (!response.ok) {
    const message =
      (parsed as GcErrorBody).error?.message ??
      `GoCardless request failed with status ${response.status}`;
    throw new GoCardlessApiError(message, response.status);
  }
  return parsed as T;
}

/** Input for the two-step Billing Request flow (onboarding, spec §1). */
export type BillingRequestFlowInput = {
  customerEmail: string;
  orgId: string;
  redirectUri: string;
  exitUri: string;
};

/** Hosted-page handoff: flow id + URL to redirect the director to. */
export type BillingRequestFlowResult = {
  flowId: string;
  authorisationUrl: string;
};

type BillingRequestResponse = {
  billing_requests: { id: string };
};

type BillingRequestFlowResponse = {
  billing_request_flows: { id: string; authorisation_url: string };
};

/**
 * Two-step Bacs mandate setup (spec §1 onboarding):
 * 1. POST /billing_requests with a bacs mandate_request envelope.
 * 2. POST /billing_request_flows linking it, with redirect/exit URIs and the
 *    director's email prefilled for the hosted page.
 */
export async function createBillingRequestFlow(
  input: BillingRequestFlowInput,
): Promise<BillingRequestFlowResult> {
  const billingRequest = await gcRequest<BillingRequestResponse>(
    "/billing_requests",
    {
      method: "POST",
      body: {
        billing_requests: {
          mandate_request: { scheme: "bacs" },
          metadata: { org_id: input.orgId },
        },
      },
    },
  );

  const flow = await gcRequest<BillingRequestFlowResponse>(
    "/billing_request_flows",
    {
      method: "POST",
      body: {
        billing_request_flows: {
          links: { billing_request: billingRequest.billing_requests.id },
          redirect_uri: input.redirectUri,
          exit_uri: input.exitUri,
          prefilled_customer: { email: input.customerEmail },
        },
      },
    },
  );

  return {
    flowId: flow.billing_request_flows.id,
    authorisationUrl: flow.billing_request_flows.authorisation_url,
  };
}

/**
 * Verify a GoCardless webhook (spec §1): timing-safe comparison of the
 * Webhook-Signature header against HMAC-SHA256(secret, rawBody) hex.
 * Returns false for a missing header or any mismatch — never throws.
 */
export function verifyGoCardlessWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) {
    return false;
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(signatureHeader, "utf8");
  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, providedBuf);
}
