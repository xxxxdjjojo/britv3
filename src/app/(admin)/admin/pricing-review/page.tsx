// src/app/(admin)/admin/pricing-review/page.tsx
//
// Memo Pivot v2 — Week 12-13 pricing-review dashboard.

import type { Metadata } from "next";

import { PricingReviewDashboard } from "@/components/admin/PricingReviewDashboard";
import { createClient } from "@/lib/supabase/server";
import {
  buildSnapshot,
  fetchSubscriptionRows,
} from "@/services/analytics/pricing-metrics-service";

export const metadata: Metadata = {
  title: "Pricing Review | Britestate Admin",
};

async function requireAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    return data?.is_admin === true;
  } catch {
    return false;
  }
}

export default async function PricingReviewPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Pricing Review
        </h1>
        <p className="mt-4 text-neutral-700">Admin access required.</p>
      </div>
    );
  }

  const rows = await fetchSubscriptionRows();
  const snapshot = buildSnapshot(rows);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Pricing Review
        </h1>
        <p className="mt-2 text-neutral-700">
          Week 12-13 checkpoint per the memo: paying users, MRR by segment, and
          churn observed since the v2 cutover. Compare against the memo&apos;s
          conservative (120) / base (600) / bull (2,000) targets.
        </p>
      </header>
      <PricingReviewDashboard snapshot={snapshot} />
    </div>
  );
}
