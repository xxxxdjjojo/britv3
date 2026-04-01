"use client";

/**
 * ProviderSidebar — Client Component
 *
 * "Invisible Estate" design: glassmorphism-style sticky sidebar widget.
 * No 1px borders — surface-container-low background (#f4f3f2) shifts for depth.
 * Renders the "Get a Free Quote" CTA card and Britestate protection trust badge.
 */

import { useState } from "react";
import { ShieldCheck, Star } from "lucide-react";
import { QuoteModal } from "@/components/providers/QuoteModal";
import type { ServiceProviderPublicProfile } from "@/types/providers";

type ProviderSidebarProps = Readonly<{
  provider: ServiceProviderPublicProfile;
}>;

export default function ProviderSidebar({ provider }: ProviderSidebarProps) {
  const [quoteOpen, setQuoteOpen] = useState(false);

  const serviceNames = (provider.services ?? []).map((svc) =>
    String(svc).replace(/_/g, " "),
  );

  const avg = provider.provider_rating_stats?.avg_rating ?? null;
  const totalReviews = provider.provider_rating_stats?.total_reviews ?? 0;

  return (
    <div className="sticky top-24 space-y-4" id="quote">
      {/* Quote CTA card — glassmorphism surface */}
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-2xl shadow-sm p-6">
        {/* Provider mini-identity */}
        {avg !== null && (
          <div className="flex items-center gap-1.5 mb-4">
            <Star className="w-4 h-4 fill-brand-secondary text-brand-secondary" aria-hidden="true" />
            <span className="text-sm font-bold text-neutral-950 dark:text-white tracking-tight">
              {avg.toFixed(1)}
            </span>
            <span className="text-xs text-neutral-400">({totalReviews} reviews)</span>
          </div>
        )}

        <div className="mb-5">
          <h2 className="text-xl font-bold font-heading tracking-tight text-neutral-950 dark:text-white">
            Get a Free Quote
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            No obligation — free and instant
          </p>
        </div>

        {/* Display-only form fields — clicking CTA opens QuoteModal */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Service type
            </label>
            <select
              disabled
              className="w-full rounded-xl bg-surface-container-low dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
              aria-label="Service type (opens in quote modal)"
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
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Preferred date
            </label>
            <input
              type="date"
              disabled
              className="w-full rounded-xl bg-surface-container-low dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
              aria-label="Preferred date (opens in quote modal)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Description
            </label>
            <textarea
              disabled
              rows={3}
              placeholder="Tell us what you need..."
              className="w-full rounded-xl bg-surface-container-low dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-400 dark:text-neutral-500 resize-none cursor-not-allowed"
              aria-label="Job description (opens in quote modal)"
            />
          </div>

          <button
            type="button"
            onClick={() => setQuoteOpen(true)}
            className="w-full min-h-[44px] bg-brand-primary hover:bg-brand-primary/90 active:bg-brand-primary-dark text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm shadow-sm"
            aria-label={`Request a quote from ${provider.business_name}`}
          >
            Send Quote Request
          </button>
        </div>
      </div>

      {/* Britestate protection trust card */}
      <div className="bg-surface-container-low dark:bg-neutral-900 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/30 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-brand-primary dark:text-success" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
              Britestate Protection
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Book through Britestate to be eligible for our £1,000 Satisfaction Guarantee
            </p>
          </div>
        </div>
      </div>

      {/* QuoteModal */}
      <QuoteModal
        providerId={provider.id}
        providerName={provider.business_name}
        services={serviceNames}
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
      />
    </div>
  );
}
