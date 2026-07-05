import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { NotLegalAdviceBanner } from "@/components/trust/NotLegalAdviceBanner";
import {
  PLEDGE_ITEMS,
  FAIR_LANDLORD_DISCLAIMER,
  CHARTER_SUMMARY,
} from "@/content/fair-landlord-register/charter";

import { RegisterSearch } from "./RegisterSearch";
import { PledgeActions } from "./PledgeActions";

export const metadata: Metadata = {
  title: "Fair Landlord Register | TrueDeed",
  description: CHARTER_SUMMARY,
  alternates: { canonical: "/fair-landlord-register" },
  openGraph: {
    title: "Fair Landlord Register | TrueDeed",
    description: CHARTER_SUMMARY,
    url: "/fair-landlord-register",
  },
};

type Pledge = {
  id: string;
  display_name: string | null;
  area: string | null;
  pledged_at: string;
};

export default async function FairLandlordRegisterPage() {
  const supabase = await createClient();

  // Published pledges — visible to everyone (RLS gates on status='published').
  const { data: pledges } = await supabase
    .from("fair_landlord_pledges")
    .select("id,display_name,area,pledged_at")
    .eq("status", "published")
    .order("pledged_at", { ascending: false });

  const publishedPledges: Pledge[] = (pledges ?? []) as Pledge[];

  // Detect authenticated landlord and whether they have an active pledge.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLandlord =
    user !== null &&
    (user.app_metadata as Record<string, unknown>)?.role === "landlord";

  let hasPledged = false;
  if (isLandlord) {
    const { data: existing } = await supabase
      .from("fair_landlord_pledges")
      .select("id")
      .eq("landlord_id", user!.id)
      .in("status", ["pending", "published"])
      .maybeSingle();
    hasPledged = existing !== null;
  }

  return (
    <div>
      {/* Hero */}
      <section
        aria-labelledby="register-heading-hero"
        className="bg-brand-primary text-white"
      >
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-brand-primary-lighter">
            Influence Strategy · For landlords
          </p>
          <h1
            id="register-heading-hero"
            className="font-heading text-4xl font-bold leading-tight sm:text-5xl"
          >
            Fair Landlord Register
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/85">
            A public list of landlords who have committed to fair practice —
            timely repairs, transparent fees, fair deposit returns, and no
            retaliatory eviction.
          </p>
          <p className="mt-3 text-sm text-white/65">
            {FAIR_LANDLORD_DISCLAIMER}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-12 px-4 py-12 sm:px-6">
        <NotLegalAdviceBanner variant="rights" />

        {/* Charter */}
        <section aria-labelledby="charter-heading">
          <h2
            id="charter-heading"
            className="mb-6 font-heading text-2xl font-bold text-foreground"
          >
            The charter
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            By signing, a landlord publicly commits to each of the following
            points. These are voluntary commitments — they do not add to or
            replace any statutory obligation.
          </p>
          <ol className="space-y-4">
            {PLEDGE_ITEMS.map((item, i) => (
              <li
                key={item.id}
                className="flex gap-4 rounded-xl border border-border bg-background p-5"
              >
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{item.heading}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Signup CTA — landlords only */}
        {isLandlord && (
          <section aria-labelledby="signup-heading">
            <h2
              id="signup-heading"
              className="mb-4 font-heading text-2xl font-bold text-foreground"
            >
              {hasPledged ? "Your pledge" : "Sign the charter"}
            </h2>
            {!hasPledged && (
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Signing is free and takes less than a minute. Your pledge will
                appear on the public register once reviewed.
              </p>
            )}
            <PledgeActions hasPledged={hasPledged} />
          </section>
        )}

        {/* Register */}
        <RegisterSearch pledges={publishedPledges} />
      </div>
    </div>
  );
}
