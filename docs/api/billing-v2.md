# Billing API — Memo Pivot v2

The checkout / webhook / refund endpoints did **not** change shape with
the v2 pivot. Only the plan id and price id catalogue did. This doc is
the v2 reference for callers (mobile, partner, internal tools).

## Checkout

`POST /api/billing/checkout`

```jsonc
{
  "planId": "provider_pro",           // see billing-config.ts ALL_PLANS
  "priceId": "price_1TZvVSD…",        // resolved client-side from the plan
  "interval": "monthly",              // "monthly" | "annual" | "one_off"
  "segment": "provider"               // for analytics + audit
}
```

Responses:

- `200` — `{ checkoutUrl }` (Stripe Embedded Checkout client secret).
- `400` — payload validation error (zod).
- `401` — caller is not authenticated.
- `409` — priceId is not on the allowlist (`isPriceIdAllowed` rejects).

Public clients (e.g. `/pricing` CTAs) MAY call this unauthenticated; a
`401` is expected and triggers the client to navigate the user to
`/register?role=…&plan=…` to complete signup before re-attempting.

## Webhook

`POST /api/webhooks/stripe`

Stripe-signed. Unchanged. Subscription lifecycle events flow into
`stripe-event-processor.ts`, which resolves the price id to an
internal plan id via `resolveInternalPlanId(stripePriceId, fallback)`.

## Refund

`POST /api/billing/refund`

14-day refund window. £100 auto-approve threshold. Unchanged.

## Plan lookups

Server-side TypeScript:

```ts
import {
  ALL_PLANS,
  PLANS_BY_SEGMENT,
  getPlanByPriceId,
  isPriceIdAllowed,
  resolveInternalPlanId,
} from "@/lib/billing-config";
import { calculatePlatformFee } from "@/services/provider/provider-payment-service";

// All seven segments
PLANS_BY_SEGMENT.seller;          // SELLER_PLANS
PLANS_BY_SEGMENT.provider_niche;  // niche providers

// Price-ID → plan
getPlanByPriceId(priceId)?.id;

// Tier-banded commission
calculatePlatformFee({ grossAmountPence: 100_000, providerPlanId: "provider_pro" });
// → 10_000 (10% of £1,000 = £100)
```

## Exposure

`POST /api/experiments/exposure`

```jsonc
{ "flag": "sellers_default_tier", "variant": "plus" }
```

Always `200 { ok: true }`. Telemetry never blocks the request.

## SDR

`GET /api/admin/sdr` — queue summary + recent jobs (admin only).
`POST /api/admin/sdr` — enqueue an outbound target (admin only).
`POST /api/admin/sdr/process?limit=50` — batch processor; admin OR
header `x-cron-key: $CRON_SECRET`.

## Invites

`GET /api/invites/[code]` — validates without redeeming. `404` if
invalid.
`POST /api/invites/[code]` — redeems (requires auth). `409` if already
redeemed or invalid.
