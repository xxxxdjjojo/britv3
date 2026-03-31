/**
 * ServicesTab — Server Component
 *
 * "Invisible Estate" design: surface-container-low service cards (no borders),
 * soft pricing badges using background-shift, brand-primary CTA buttons.
 *
 * Quote buttons use data-quote-service attributes; the ServicesTabWithModal
 * client wrapper handles event delegation to open the QuoteModal.
 */

import { Clock, Wrench } from "lucide-react";
import type { ProviderService, ProviderPricing } from "@/types/providers";

type ServicesTabProps = Readonly<{
  services: ProviderService[];
  providerId: string;
}>;

function PricingBadge({ pricing }: Readonly<{ pricing: ProviderPricing }>) {
  if (pricing.type === "hourly") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
        £{pricing.amount}/{pricing.unit}
      </span>
    );
  }
  if (pricing.type === "fixed") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-success">
        £{pricing.amount.toLocaleString("en-GB")} fixed
      </span>
    );
  }
  // type === "quote"
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-secondary/10 text-brand-secondary-dark dark:bg-brand-secondary/15 dark:text-brand-secondary">
      Quote on request
    </span>
  );
}

export function ServicesTab({ services, providerId: _providerId }: ServicesTabProps) {
  if (services.length === 0) {
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-bold font-heading tracking-tight text-neutral-950 dark:text-white">
          Services &amp; Pricing
        </h2>
        <div className="py-16 rounded-2xl bg-surface-container-low dark:bg-neutral-800 text-center">
          <Wrench className="w-10 h-10 text-neutral-400 mx-auto mb-3" aria-hidden="true" />
          <p className="text-neutral-500 dark:text-neutral-400 font-medium">No services listed yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Section header */}
      <h2 className="text-2xl font-bold font-heading tracking-tight text-neutral-950 dark:text-white">
        Services &amp; Pricing
        <span className="text-base font-normal text-neutral-400 ml-2">({services.length})</span>
      </h2>

      {/* Services grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="p-5 rounded-2xl bg-surface-container-low dark:bg-neutral-800 hover:bg-[#eceae8] dark:hover:bg-[#1f302a] transition-colors flex flex-col"
          >
            {/* Service name + pricing badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-base font-bold text-neutral-950 dark:text-white leading-snug font-heading tracking-tight">
                {service.name}
              </h3>
              <PricingBadge pricing={service.pricing} />
            </div>

            {/* Description */}
            {service.description && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                {service.description}
              </p>
            )}

            {/* Duration estimate */}
            {service.estimated_duration_hours !== null && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span>
                  ~{service.estimated_duration_hours}{" "}
                  {service.estimated_duration_hours === 1 ? "hour" : "hours"}{" "}
                  estimated
                </span>
              </div>
            )}

            {/* Request Quote CTA — data attribute for event delegation */}
            <div className="mt-auto pt-3">
              <button
                type="button"
                data-quote-service={service.name}
                className="w-full min-h-[44px] bg-brand-primary text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-brand-primary/90 active:bg-brand-primary-dark transition-colors text-sm shadow-sm"
                aria-label={`Request quote for ${service.name}`}
              >
                Request Quote
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
