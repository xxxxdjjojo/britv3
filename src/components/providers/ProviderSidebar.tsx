"use client";

/**
 * ProviderSidebar — Client Component
 *
 * Renders the sticky "Get a Free Quote" sidebar widget and trust card for
 * a tradesperson public profile page. Opens QuoteModal on CTA click, and
 * auto-opens it when the page is visited with ?intent=quote (emitted by
 * quote CTAs on cards/other pages).
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { QuoteModal } from "@/components/providers/QuoteModal";
import type { ServiceProviderPublicProfile } from "@/types/providers";

type ProviderSidebarProps = Readonly<{
  provider: ServiceProviderPublicProfile;
}>;

const SOURCE_MAX_LENGTH = 80;
const SOURCE_PATTERN = /^[a-z0-9_]+$/i;

/** Sanitise the ?source= attribution param; undefined falls back to the
 *  QuoteModal default ("trader_profile_modal"). */
function sanitiseSource(raw: string | null): string | undefined {
  if (!raw) return undefined;
  if (raw.length > SOURCE_MAX_LENGTH || !SOURCE_PATTERN.test(raw)) {
    return undefined;
  }
  return raw;
}

export default function ProviderSidebar({ provider }: ProviderSidebarProps) {
  const searchParams = useSearchParams();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const source = sanitiseSource(searchParams.get("source"));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-open the quote modal when arriving with ?intent=quote
    if (searchParams.get("intent") === "quote") setQuoteOpen(true);
  }, [searchParams]);

  return (
    <div className="sticky top-24 space-y-6" id="quote">
      {/* Quote form card — deep-green surface */}
      <div className="bg-brand-primary text-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Get a Free Quote</h2>
          <p className="text-sm text-white/70 mt-1">
            No obligation — free and instant
          </p>
        </div>

        {/* Display-only form fields — clicking CTA opens QuoteModal */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-white/60 mb-2">
              Service type
            </label>
            <select
              disabled
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white/70"
            >
              <option value="">Select a service...</option>
              {(provider.services ?? []).map((svc) => (
                <option key={String(svc)} value={String(svc)}>
                  {String(svc).replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-white/60 mb-2">
              Preferred date
            </label>
            <input
              type="date"
              disabled
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white/70"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-white/60 mb-2">
              Description
            </label>
            <textarea
              disabled
              rows={3}
              placeholder="Tell us what you need..."
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white/70 placeholder:text-white/40 resize-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setQuoteOpen(true)}
            className="w-full bg-white text-brand-primary hover:bg-brand-primary-lighter font-bold py-3 px-4 rounded-xl shadow-lg transition-colors text-sm"
          >
            Send Quote Request
          </button>
        </div>
      </div>

      {/* TrueDeed protection trust card */}
      <div className="bg-brand-primary-lighter dark:bg-brand-primary/10 rounded-2xl border border-brand-primary/20 p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-primary-dark dark:text-white">
              TrueDeed Protection
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Book through TrueDeed to be eligible for our £1,000 Satisfaction Guarantee
            </p>
          </div>
        </div>
      </div>

      {/* QuoteModal */}
      <QuoteModal
        providerUserId={provider.user_id}
        providerName={provider.business_name}
        categories={provider.services ?? []}
        source={source}
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
      />
    </div>
  );
}
