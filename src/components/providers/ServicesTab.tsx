/**
 * ServicesTab — Server Component
 *
 * Renders a grid of service cards for a tradesperson's public profile.
 * Each card shows service name, description, pricing badge, duration estimate,
 * and a "Request Quote" button.
 *
 * Quote buttons use data-quote-service attributes; the ServicesTabWithModal
 * client wrapper handles event delegation to open the QuoteModal.
 */

import { Clock } from "lucide-react";
import type { ProviderService, ProviderPricing } from "@/types/providers";

type ServicesTabProps = Readonly<{
  services: ProviderService[];
  providerId: string;
}>;

function PricingBadge({ pricing }: Readonly<{ pricing: ProviderPricing }>) {
  if (pricing.type === "hourly") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
        £{pricing.amount}/{pricing.unit}
      </span>
    );
  }
  if (pricing.type === "fixed") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
        £{pricing.amount.toLocaleString("en-GB")} fixed
      </span>
    );
  }
  // type === "quote"
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
      Quote on request
    </span>
  );
}

export function ServicesTab({ services, providerId: _providerId }: ServicesTabProps) {
  if (services.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Services &amp; Pricing
        </h2>
        <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No services listed yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        Services &amp; Pricing ({services.length})
      </h2>

      {/* Services grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow flex flex-col"
          >
            {/* Service name + pricing badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {service.name}
              </h3>
              <PricingBadge pricing={service.pricing} />
            </div>

            {/* Description */}
            {service.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                {service.description}
              </p>
            )}

            {/* Duration estimate */}
            {service.estimated_duration_hours !== null && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  ~{service.estimated_duration_hours}{" "}
                  {service.estimated_duration_hours === 1 ? "hour" : "hours"}{" "}
                  estimated
                </span>
              </div>
            )}

            {/* Request Quote CTA — uses data attribute for client event delegation */}
            <div className="mt-auto pt-3">
              <button
                type="button"
                data-quote-service={service.name}
                className="w-full bg-[#2563EB] text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
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
