---
title: Promo code issues
area: payments
severity_default: P4
code_paths:
  - src/app/api/admin/promo-codes/route.ts
  - src/components/admin/PromoCodesClient.tsx
  - src/app/api/billing/checkout/route.ts
  - src/lib/billing-config.ts
tables:
  - promo_codes
  - subscriptions
admin_surfaces:
  - /admin/promo-codes
  - /admin/subscriptions
tier1_actions: []
alert_rules: []
last_verified_commit: 4c3fe1ff
---

# Promo code issues

## Summary
A promotion code won't apply at checkout, applies the wrong discount, or a
customer expected a discount that was never configured/valid.

## Symptoms
- "My code doesn't work / says invalid."
- Discount applied differs from what was advertised.
- Code expired, usage-capped, or scoped to a different plan/segment.

## Customer impact
Low — a pricing/discount inconvenience, not a service outage. Occasionally a
goodwill/revenue question.

## Severity
P4 default; raise if a launch campaign's codes are all broken (marketing impact).

## Detection
Customer ticket. No automated alert — promo correctness is a config concern.

## Scope check
One code vs a whole campaign. A whole campaign failing points at code
configuration or the checkout-apply path.

## Code paths
Admin CRUD `src/app/api/admin/promo-codes/route.ts` + `PromoCodesClient.tsx`;
application at checkout `src/app/api/billing/checkout/route.ts` using plan/price
data from `src/lib/billing-config.ts`.

## Data & tables
- `promo_codes` — the code definition (validity, cap, scope, discount).
- `subscriptions` — where the discounted plan lands.

## Diagnosis
1. Look up the code in `/admin/promo-codes`: active? expired? usage cap reached?
   plan/segment scope correct?
2. Confirm the customer is purchasing the plan the code applies to.
3. Reproduce the apply step at checkout.

## Common root causes
- Code expired or hit its usage cap.
- Code scoped to a different plan/segment than the customer's cart.
- Typo, or code never created/synced to Stripe.

## Remediation
- No Tier-1 action — promo handling is an admin CRUD/config task, deliberately not
  a self-serve customer-account remedy.
- Correct or extend the code in `/admin/promo-codes` (validity, cap, scope), or
  issue a valid alternative. For an honoured-but-misconfigured discount, apply the
  agreed adjustment through the normal billing path and record why.

## Rollback
Config-only; revert the code change in `/admin/promo-codes` if it was wrong.

## Verification
The customer applies the code (or the corrected one) at checkout and sees the
correct discount; the resulting `subscriptions` row reflects it.

## Communication
Explain plainly why the code failed (expired/capped/scope) and what to do next.

## Escalation
Entire campaign broken → marketing + billing owner; never a security path.

## Prevention & follow-up
Verify codes end-to-end before campaigns; keep Stripe coupon provisioning in sync
with `promo_codes`.

## Related
- Feature: `checkout-failing.md`
- Admin: `/admin/promo-codes`
