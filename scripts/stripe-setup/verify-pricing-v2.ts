// scripts/stripe-setup/verify-pricing-v2.ts
//
// MEMO PIVOT v2 — asserts every plan in pricing-v2-plans.ts resolves to
// an active Stripe Product + Price in the connected account.
//
// Usage:
//   pnpm tsx scripts/stripe-setup/verify-pricing-v2.ts

import fsSync from "node:fs";
import path from "node:path";
import process from "node:process";

import Stripe from "stripe";

import { PLANS, BOOSTS } from "./pricing-v2-plans.ts";

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fsSync.existsSync(envPath)) return;
  const content = fsSync.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx < 0) continue;
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if (v.startsWith('"') || v.startsWith("'")) {
      const quote = v[0];
      const closing = v.indexOf(quote, 1);
      v = closing > 0 ? v.slice(1, closing) : v.slice(1);
    } else {
      const hashIdx = v.search(/\s+#/);
      if (hashIdx >= 0) v = v.slice(0, hashIdx);
      v = v.trim();
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

interface VerifyResult {
  readonly planId: string;
  readonly ok: boolean;
  readonly issues: string[];
}

async function verifyPlan(
  stripe: Stripe,
  planId: string,
  segment: string,
  monthlyPence: number,
  annualPence: number,
  pricingType: "subscription" | "one_off",
): Promise<VerifyResult> {
  const issues: string[] = [];

  const products = await stripe.products.search({
    query: `metadata['britestate_plan_id']:'${planId}' AND active:'true'`,
    limit: 1,
  });
  const product = products.data[0];
  if (!product) {
    issues.push(`product missing for ${planId}`);
    return { planId, ok: false, issues };
  }
  if (product.metadata.britestate_segment !== segment) {
    issues.push(
      `product ${planId} has segment '${product.metadata.britestate_segment}', expected '${segment}'`,
    );
  }

  const intervals = pricingType === "one_off" ? ["one_off"] : ["monthly"];
  if (pricingType === "subscription" && annualPence > 0) intervals.push("annual");

  for (const interval of intervals) {
    const prices = await stripe.prices.search({
      query: `product:'${product.id}' AND metadata['britestate_interval']:'${interval}' AND active:'true'`,
      limit: 1,
    });
    const price = prices.data[0];
    if (!price) {
      issues.push(`price missing: ${planId} ${interval}`);
      continue;
    }
    const expected =
      interval === "annual" ? annualPence : monthlyPence;
    if (price.unit_amount !== expected) {
      issues.push(
        `price ${planId} ${interval}: unit_amount ${price.unit_amount} != expected ${expected}`,
      );
    }
    if (price.currency !== "gbp") {
      issues.push(`price ${planId} ${interval}: currency ${price.currency} != gbp`);
    }
  }

  return { planId, ok: issues.length === 0, issues };
}

async function main(): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  const stripe = new Stripe(key);

  console.log("===========================================");
  console.log("Britestate Memo Pivot v2 — Stripe verification");
  console.log("===========================================");

  const results: VerifyResult[] = [];

  for (const plan of PLANS) {
    const r = await verifyPlan(
      stripe,
      plan.planId,
      plan.segment,
      plan.monthlyPence,
      plan.annualPence,
      plan.pricingType,
    );
    results.push(r);
    console.log(r.ok ? `[OK]   ${plan.planId}` : `[FAIL] ${plan.planId}`);
    for (const issue of r.issues) console.log(`         ${issue}`);
  }

  for (const boost of BOOSTS) {
    const planLikeId = `boost_${boost.boostId}`;
    const r = await verifyPlan(
      stripe,
      planLikeId,
      "boost",
      boost.pricePence,
      0,
      "one_off",
    );
    results.push(r);
    console.log(r.ok ? `[OK]   ${planLikeId}` : `[FAIL] ${planLikeId}`);
    for (const issue of r.issues) console.log(`         ${issue}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log("");
  console.log(`Summary: ${results.length - failed.length}/${results.length} OK`);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error("[verify-pricing-v2] FAILED");
  console.error(err);
  process.exit(1);
});
