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
      <div className="bg-brand-primary text-white rounded-xl p-6">
        <h2 className="text-xl font-bold">Ready to get started?</h2>
        <p className="text-sm text-brand-primary-lighter mt-2 leading-relaxed">
          {provider.business_name} typically responds within{" "}
          <strong>{responseTimeHours}h</strong>
        </p>
        <a
          href={ctaHref}
          className="mt-4 block w-full text-center bg-white text-brand-primary font-semibold py-2.5 px-4 rounded-lg text-sm hover:bg-brand-primary-lighter transition-colors"
        >
          {ctaLabel}
        </a>
      </div>

      {/* Contact info card */}
      {(provider.phone || email) && (
        <div className="bg-surface-container-lowest dark:bg-neutral-900 rounded-xl border border-[--color-outline-variant] dark:border-neutral-800 p-5 space-y-3">
          <h3 className="text-sm font-bold text-on-surface dark:text-white">Contact</h3>
          {provider.phone && (
            <a
              href={`tel:${provider.phone}`}
              className="flex items-center gap-2 text-sm text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant] hover:text-brand-accent dark:hover:text-brand-accent/80 transition-colors"
            >
              <Phone className="w-4 h-4 shrink-0 text-[--color-on-surface-variant]" />
              {provider.phone}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 text-sm text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant] hover:text-brand-accent dark:hover:text-brand-accent/80 transition-colors truncate"
            >
              <Mail className="w-4 h-4 shrink-0 text-[--color-on-surface-variant]" />
              {email}
            </a>
          )}
        </div>
      )}

      {/* Britestate protection blurb */}
      <div className="bg-surface-container-lowest dark:bg-neutral-900 rounded-xl border border-[--color-outline-variant] dark:border-neutral-800 p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface dark:text-white">
              Britestate Protection
            </h3>
            <p className="text-xs text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant] mt-1 leading-relaxed">
              Book through Britestate to be eligible for our £1,000 Satisfaction Guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
