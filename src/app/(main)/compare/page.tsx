"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitCompareArrows } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCompare } from "@/components/compare/useCompare";
import { CompareTable } from "@/components/compare/CompareTable";
import type { CompareProvider } from "@/types/providers";

export default function ComparePage() {
  const { ids } = useCompare();
  const [providers, setProviders] = useState<CompareProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- short-circuit when the compare tray is empty
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("service_provider_details")
      .select(
        "id:user_id, slug, business_name, services, service_postcodes, accreditations, response_time_hours, pricing, profiles(avatar_url, full_name:display_name, provider_verification_status), provider_rating_stats(average_rating, total_reviews)",
      )
      .in("user_id", ids)
      .then(({ data }) => {
        setProviders((data as unknown as CompareProvider[]) ?? []);
        setLoading(false);
      });
  }, [ids]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface dark:bg-slate-950">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-heading font-bold text-brand-primary-dark mb-3 tracking-tight">
            Compare Service Providers
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Compare your shortlisted professionals side-by-side to make the
            most informed decision.
          </p>
        </div>

        {ids.length === 0 ? (
          <div className="text-center py-20">
            <GitCompareArrows className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">
              No providers to compare
            </h2>
            <p className="text-muted-foreground mb-6">
              Browse provider profiles and click &quot;Compare&quot; to add up
              to 3 providers.
            </p>
            <Link
              href="/services"
              className="bg-brand-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-primary-dark transition-colors"
            >
              Find Providers
            </Link>
          </div>
        ) : (
          <CompareTable providers={providers} />
        )}
      </main>
    </div>
  );
}
