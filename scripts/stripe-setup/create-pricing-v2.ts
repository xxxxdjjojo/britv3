// scripts/stripe-setup/create-pricing-v2.ts
//
// MEMO PIVOT v2 — provisions Stripe Products + Prices for the new
// 7-segment pricing schema. Idempotent: every Product carries
// metadata.britestate_plan_id and every Price carries
// metadata.britestate_plan_id + metadata.britestate_interval so
// repeated runs reuse existing artifacts.
//
// Usage:
//   pnpm tsx scripts/stripe-setup/create-pricing-v2.ts
//
// Requires STRIPE_SECRET_KEY in .env.local (test mode — sk_test_…).
// Refuses to run against live keys.

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import process from "node:process";

import Stripe from "stripe";

import { PLANS, BOOSTS, type PlanDef, type BoostDef } from "./pricing-v2-plans.ts";

// Load .env.local without a dotenv dep. Lines like KEY=value (no export).
// Strips inline `# comment` after whitespace, supports quoted values.
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
      // Strip inline ` # comment` (whitespace + hash, common in hand-edited files)
      const hashIdx = v.search(/\s+#/);
      if (hashIdx >= 0) v = v.slice(0, hashIdx);
      v = v.trim();
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const ROOT = process.cwd();
const OUTPUT_ENV_PATH = path.join(ROOT, ".env.pricing-v2.generated");

interface PriceTuple {
  readonly envVar: string;
  readonly priceId: string;
}

async function findProductByPlanId(
  stripe: Stripe,
  planId: string,
): Promise<Stripe.Product | null> {
  const result = await stripe.products.search({
    query: `metadata['britestate_plan_id']:'${planId}' AND active:'true'`,
    limit: 1,
  });
  return result.data[0] ?? null;
}

async function findPrice(
  stripe: Stripe,
  productId: string,
  intervalLabel: string,
): Promise<Stripe.Price | null> {
  const result = await stripe.prices.search({
    query: `product:'${productId}' AND metadata['britestate_interval']:'${intervalLabel}' AND active:'true'`,
    limit: 1,
  });
  return result.data[0] ?? null;
}

async function ensureProduct(
  stripe: Stripe,
  plan: PlanDef,
): Promise<Stripe.Product> {
  const existing = await findProductByPlanId(stripe, plan.planId);
  if (existing) {
    console.log(`[=] product ${plan.planId} (${existing.id})`);
    return existing;
  }
  const created = await stripe.products.create({
    name: plan.name,
    metadata: {
      britestate_plan_id: plan.planId,
      britestate_segment: plan.segment,
      britestate_pricing_type: plan.pricingType,
    },
  });
  console.log(`[+] product ${plan.planId} (${created.id})`);
  return created;
}

async function ensurePrice(
  stripe: Stripe,
  product: Stripe.Product,
  plan: PlanDef,
  variant: "monthly" | "annual" | "one_off",
  pence: number,
): Promise<string> {
  const intervalLabel = variant;
  const existing = await findPrice(stripe, product.id, intervalLabel);
  if (existing) {
    console.log(`    [=] price ${intervalLabel} ${existing.id}`);
    return existing.id;
  }
  const recurring: Stripe.PriceCreateParams.Recurring | undefined =
    variant === "monthly"
      ? { interval: "month" }
      : variant === "annual"
        ? { interval: "year" }
        : undefined;
  const created = await stripe.prices.create({
    product: product.id,
    currency: "gbp",
    unit_amount: pence,
    recurring,
    nickname: `${plan.name} — ${intervalLabel}`,
    metadata: {
      britestate_plan_id: plan.planId,
      britestate_interval: intervalLabel,
      britestate_segment: plan.segment,
    },
  });
  console.log(`    [+] price ${intervalLabel} ${created.id}`);
  return created.id;
}

async function ensureBoost(stripe: Stripe, boost: BoostDef): Promise<string> {
  const planLikeId = `boost_${boost.boostId}`;
  const productsSearch = await stripe.products.search({
    query: `metadata['britestate_plan_id']:'${planLikeId}' AND active:'true'`,
    limit: 1,
  });
  let product = productsSearch.data[0];
  if (!product) {
    product = await stripe.products.create({
      name: boost.name,
      metadata: {
        britestate_plan_id: planLikeId,
        britestate_segment: "boost",
        britestate_pricing_type: "one_off",
      },
    });
    console.log(`[+] product ${planLikeId} (${product.id})`);
  } else {
    console.log(`[=] product ${planLikeId} (${product.id})`);
  }
  const priceSearch = await stripe.prices.search({
    query: `product:'${product.id}' AND metadata['britestate_interval']:'one_off' AND active:'true'`,
    limit: 1,
  });
  let price = priceSearch.data[0];
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: "gbp",
      unit_amount: boost.pricePence,
      nickname: boost.name,
      metadata: {
        britestate_plan_id: planLikeId,
        britestate_interval: "one_off",
        britestate_segment: "boost",
      },
    });
    console.log(`    [+] price ${price.id}`);
  } else {
    console.log(`    [=] price ${price.id}`);
  }
  return price.id;
}

async function main(): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set in .env.local");
  }
  if (!key.startsWith("sk_test_")) {
    throw new Error(
      "Refusing to run against a non-test Stripe key. Use sk_test_… for provisioning.",
    );
  }

  // Stripe SDK in this repo currently requires apiVersion at construction.
  // Use null assertion to accept the default version pinned by the package.
  const stripe = new Stripe(key);

  console.log("===========================================");
  console.log("Britestate Memo Pivot v2 — Stripe provisioning");
  console.log("===========================================");
  console.log(`Plans: ${PLANS.length}   Boosts: ${BOOSTS.length}`);
  console.log("");

  const tuples: PriceTuple[] = [];

  for (const plan of PLANS) {
    console.log(`-- ${plan.planId} (${plan.name}) --`);
    const product = await ensureProduct(stripe, plan);
    if (plan.pricingType === "one_off") {
      const priceId = await ensurePrice(
        stripe,
        product,
        plan,
        "one_off",
        plan.monthlyPence,
      );
      tuples.push({ envVar: plan.envVarMonthly, priceId });
    } else {
      const monthlyId = await ensurePrice(
        stripe,
        product,
        plan,
        "monthly",
        plan.monthlyPence,
      );
      tuples.push({ envVar: plan.envVarMonthly, priceId: monthlyId });
      if (plan.annualPence > 0) {
        const annualId = await ensurePrice(
          stripe,
          product,
          plan,
          "annual",
          plan.annualPence,
        );
        tuples.push({ envVar: plan.envVarAnnual, priceId: annualId });
      }
    }
  }

  console.log("");
  for (const boost of BOOSTS) {
    console.log(`-- ${boost.boostId} (${boost.name}) --`);
    const priceId = await ensureBoost(stripe, boost);
    tuples.push({ envVar: boost.envVar, priceId });
  }

  // Write env block
  const lines = [
    "# === Memo Pivot v2 — Stripe Price IDs (generated by create-pricing-v2.ts) ===",
    `# Generated: ${new Date().toISOString()}`,
    "",
    ...tuples.map((t) => `${t.envVar}=${t.priceId}`),
    "",
  ];
  await fs.writeFile(OUTPUT_ENV_PATH, lines.join("\n"), "utf8");

  console.log("");
  console.log("===========================================");
  console.log(`Wrote ${tuples.length} env vars to ${OUTPUT_ENV_PATH}`);
  console.log("===========================================");
  console.log("");
  console.log("Next step: append to your .env.local:");
  console.log(`  cat ${path.relative(ROOT, OUTPUT_ENV_PATH)} >> .env.local`);
  console.log("");
}

main().catch((err: unknown) => {
  console.error("[create-pricing-v2] FAILED");
  console.error(err);
  process.exit(1);
});
