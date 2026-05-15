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
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("service_provider_details")
      .select(
        "id, slug, business_name, services, city, service_postcodes, accreditations, response_time_hours, pricing, profiles(avatar_url, full_name, provider_verification_status), provider_rating_stats(average_rating, total_reviews)",
      )
      .in("id", ids)
      .then(({ data }) => {
        setProviders((data as unknown as CompareProvider[]) ?? []);
        setLoading(false);
      });
  }, [ids]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3 tracking-tight">
            Compare Service Providers
          </h1>
          <p className="text-slate-500 max-w-2xl">
            Compare your shortlisted professionals side-by-side to make the
            most informed decision.
          </p>
        </div>

        {ids.length === 0 ? (
          <div className="text-center py-20">
            <GitCompareArrows className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">
              No providers to compare
            </h2>
            <p className="text-slate-500 mb-6">
              Browse provider profiles and click &quot;Compare&quot; to add up
              to 3 providers.
            </p>
            <Link
              href="/services"
              className="bg-[#2563EB] text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
