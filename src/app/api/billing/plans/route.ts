/**
 * GET /api/billing/plans?role=agent|landlord|provider
 *
 * Returns plan definitions for the given billing role.
 * This endpoint exists so client components can access plan data
 * without importing server-only billing-config directly.
 *
 * Public endpoint — no auth required (plan details are not sensitive).
 */

import { NextResponse } from "next/server";
import { PLANS_BY_ROLE, AGENT_PLANS } from "@/lib/billing-config";
import type { BillingRole } from "@/lib/billing-config";

const VALID_ROLES = new Set<BillingRole>(["agent", "landlord", "provider"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get("role") ?? "agent";

  const role: BillingRole = VALID_ROLES.has(roleParam as BillingRole)
    ? (roleParam as BillingRole)
    : "agent";

  const plans = PLANS_BY_ROLE[role] ?? AGENT_PLANS;

  // Strip Stripe price IDs from the response — client only needs
  // display data. The actual price IDs are sent server-side during checkout.
  const safePlans = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    priceIdMonthly: plan.priceIdMonthly,
    priceIdAnnual: plan.priceIdAnnual,
    priceMonthly: plan.priceMonthly,
    priceAnnual: plan.priceAnnual,
    role: plan.role,
    features: plan.features,
    highlighted: plan.highlighted,
  }));

  return NextResponse.json(
    { plans: safePlans },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
}
