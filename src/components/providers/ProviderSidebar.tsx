/**
 * ProviderSidebar — Server Component
 *
 * Renders the sticky "Get a Free Quote" sidebar widget and trust card for
 * a tradesperson public profile page.
 */

import { ShieldCheck } from "lucide-react";
import type { ServiceProviderPublicProfile } from "@/types/providers";

type ProviderSidebarProps = Readonly<{
  provider: ServiceProviderPublicProfile;
}>;

export default function ProviderSidebar({ provider }: ProviderSidebarProps) {
  return (
    <div className="sticky top-24 space-y-4" id="quote">
      {/* Quote form card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Get a Free Quote</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            No obligation — free and instant
          </p>
        </div>

        {/* Display-only form fields — actual submission via QuoteModal in 17-03 */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Service type
            </label>
            <select
              disabled
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400"
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Preferred date
            </label>
            <input
              type="date"
              disabled
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              disabled
              rows={3}
              placeholder="Tell us what you need..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-400 resize-none"
            />
          </div>

          <button
            type="button"
            onClick={() => void 0}
            className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
          >
            Send Quote Request
          </button>
        </div>
      </div>

      {/* Britestate protection trust card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
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
