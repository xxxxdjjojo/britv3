"use client";

import { useEffect, useState } from "react";
import { GitCompareArrows, ArrowRight } from "lucide-react";
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Page header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-brand-secondary uppercase tracking-widest mb-2">
                Compare
              </p>
              <h1 className="font-heading font-bold text-neutral-900 text-3xl sm:text-4xl mb-3">
                Compare Service Providers
              </h1>
              <p className="text-neutral-600 max-w-2xl text-base leading-relaxed">
                Compare your shortlisted professionals side-by-side to make the
                most informed decision.
              </p>
            </div>
            {ids.length > 0 && (
              <a
                href="/services"
                className="inline-flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-primary/90 transition-colors shrink-0"
              >
                Browse More
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {ids.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-primary/10 mb-6">
              <GitCompareArrows className="w-10 h-10 text-brand-primary" />
            </div>
            <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-3">
              No providers to compare yet
            </h2>
            <p className="text-neutral-600 mb-8 max-w-md mx-auto leading-relaxed">
              Browse provider profiles and click &ldquo;Compare&rdquo; to add up
              to 3 professionals side-by-side.
            </p>
            <a
              href="/services"
              className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-primary/90 transition-colors"
            >
              Find Providers
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <CompareTable providers={providers} />
        )}
      </main>
    </div>
  );
}
