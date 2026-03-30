"use client";

import { useEffect, useState } from "react";
import { GitCompareArrows, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCompare } from "@/components/compare/useCompare";
import { CompareTable } from "@/components/compare/CompareTable";
import type { CompareProvider } from "@/types/providers";

export default function ComparePage() {
  const { ids } = useCompare();
  const [providers, setProviders] = useState<CompareProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const query = ids.length === 0
      ? Promise.resolve({ data: [] })
      : supabase
          .from("service_provider_details")
          .select(
            "id, slug, business_name, services, city, service_postcodes, accreditations, response_time_hours, pricing, profiles(avatar_url, full_name, provider_verification_status), provider_rating_stats(average_rating, total_reviews)",
          )
          .in("id", ids);

    query.then(({ data }) => {
      setProviders((data as unknown as CompareProvider[]) ?? []);
      setLoading(false);
    });
  }, [ids]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          <p className="text-sm text-neutral-500 font-sans">Loading comparison…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f8]">
      {/* Page header */}
      <div className="bg-[#faf9f8] border-b-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6 text-sm text-neutral-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-700 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/services" className="hover:text-neutral-700 transition-colors">Services</Link>
            <span>/</span>
            <span className="text-neutral-700 font-medium">Compare</span>
          </nav>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1
                className="font-heading text-4xl font-bold text-neutral-950 tracking-tight mb-3"
                style={{ letterSpacing: "-0.02em" }}
              >
                Compare Service Providers
              </h1>
              <p className="text-neutral-500 font-sans max-w-2xl text-base leading-relaxed">
                Compare your shortlisted professionals side-by-side to make the most informed decision.
              </p>
            </div>
            {ids.length > 0 && (
              <Link
                href="/services"
                className="inline-flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-primary-light transition-colors min-h-[44px]"
              >
                Browse More <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {ids.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-brand-primary-lighter flex items-center justify-center mb-6">
              <GitCompareArrows className="w-10 h-10 text-brand-primary" />
            </div>
            <h2
              className="font-heading text-2xl font-bold text-neutral-900 mb-3"
              style={{ letterSpacing: "-0.02em" }}
            >
              No providers to compare
            </h2>
            <p className="text-neutral-500 max-w-md mb-8 leading-relaxed">
              Browse provider profiles and click &ldquo;Compare&rdquo; to add up to 3 providers side-by-side.
            </p>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-primary-light transition-colors min-h-[44px]"
            >
              Find Providers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <CompareTable providers={providers} />
        )}
      </main>
    </div>
  );
}
