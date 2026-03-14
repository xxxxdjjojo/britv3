/**
 * SpecialistSidebar — Server Component
 *
 * Simplified sidebar for specialist professional profiles (mortgage brokers,
 * conveyancers, surveyors). Renders a CTA card, contact info card, and a
 * Britestate protection blurb.
 */

import { ShieldCheck, Phone, Mail } from "lucide-react";
import type { ServiceProviderPublicProfile } from "@/types/providers";

type SpecialistSidebarProps = Readonly<{
  provider: ServiceProviderPublicProfile;
  ctaLabel: string;
  ctaHref: string;
}>;

export default function SpecialistSidebar({
  provider,
  ctaLabel,
  ctaHref,
}: SpecialistSidebarProps) {
  // Response time from the pricing JSONB if available, else default 24h
  const pricingData = (provider as unknown as Record<string, unknown>)["pricing"];
  const responseTimeHours =
    pricingData &&
    typeof pricingData === "object" &&
    pricingData !== null &&
    typeof (pricingData as Record<string, unknown>)["response_time_hours"] === "number"
      ? ((pricingData as Record<string, unknown>)["response_time_hours"] as number)
      : 24;

  const email = provider.profiles.email;

  return (
    <div className="sticky top-24 space-y-4" id="quote">
      {/* CTA card */}
      <div className="bg-[#1B4D3E] text-white rounded-xl p-6">
        <h2 className="text-xl font-bold">Ready to get started?</h2>
        <p className="text-sm text-green-100 mt-2 leading-relaxed">
          {provider.business_name} typically responds within{" "}
          <strong>{responseTimeHours}h</strong>
        </p>
        <a
          href={ctaHref}
          className="mt-4 block w-full text-center bg-white text-[#1B4D3E] font-semibold py-2.5 px-4 rounded-lg text-sm hover:bg-green-50 transition-colors"
        >
          {ctaLabel}
        </a>
      </div>

      {/* Contact info card */}
      {(provider.phone || email) && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contact</h3>
          {provider.phone && (
            <a
              href={`tel:${provider.phone}`}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors"
            >
              <Phone className="w-4 h-4 shrink-0 text-slate-400" />
              {provider.phone}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors truncate"
            >
              <Mail className="w-4 h-4 shrink-0 text-slate-400" />
              {email}
            </a>
          )}
        </div>
      )}

      {/* Britestate protection blurb */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 bg-[#1B4D3E] rounded-full flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Britestate Protection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Book through Britestate to be eligible for our £1,000 Satisfaction Guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
