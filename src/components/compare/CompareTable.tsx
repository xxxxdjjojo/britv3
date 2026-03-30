"use client";

import { ShieldCheck, Clock, MapPin, Star, Plus, X } from "lucide-react";
import Link from "next/link";
import { useCompare } from "@/components/compare/useCompare";
import type { CompareProvider } from "@/types/providers";

type CompareTableProps = Readonly<{ providers: CompareProvider[] }>;

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating)
              ? "fill-brand-secondary text-brand-secondary"
              : "fill-neutral-200 text-neutral-200"
          }`}
        />
      ))}
      <span className="ml-1.5 text-sm font-semibold text-neutral-700">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}


export function CompareTable({ providers }: CompareTableProps) {
  const { remove } = useCompare();

  // Always render exactly 3 columns; pad with nulls
  const slots: (CompareProvider | null)[] = [
    providers[0] ?? null,
    providers[1] ?? null,
    providers[2] ?? null,
  ];

  function formatPricing(pricing: Record<string, unknown>): string {
    const entries = Object.entries(pricing);
    if (entries.length === 0) return "Contact for pricing";
    const [, value] = entries[0];
    if (typeof value === "object" && value !== null) {
      const v = value as Record<string, unknown>;
      if (v.type === "hourly" && v.amount) return `From £${v.amount}/hr`;
      if (v.type === "fixed" && v.amount) return `Fixed £${v.amount}`;
      if (v.type === "quote") return "Quote on request";
    }
    return "Contact for pricing";
  }

  function formatCoverage(postcodes: string[]): string {
    if (postcodes.length === 0) return "—";
    const shown = postcodes.slice(0, 3).join(", ");
    return postcodes.length > 3 ? `${shown} +${postcodes.length - 3} more` : shown;
  }

  const rows: {
    label: string;
    render: (p: CompareProvider) => React.ReactNode;
  }[] = [
    {
      label: "Overall Rating",
      render: (p) =>
        p.provider_rating_stats ? (
          <StarDisplay rating={p.provider_rating_stats.average_rating} />
        ) : (
          <span className="text-neutral-400 text-sm">No ratings yet</span>
        ),
    },
    {
      label: "Reviews",
      render: (p) => (
        <span className="text-neutral-700 font-semibold text-sm">
          {p.provider_rating_stats?.total_reviews ?? 0} reviews
        </span>
      ),
    },
    {
      label: "Verified",
      render: (p) =>
        p.profiles.provider_verification_status === "verified" ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary-lighter text-brand-primary text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified
          </span>
        ) : (
          <span className="text-neutral-300 text-sm">—</span>
        ),
    },
    {
      label: "Response Time",
      render: (p) =>
        p.response_time_hours != null ? (
          <span className="inline-flex items-center gap-1.5 text-neutral-600 text-sm">
            <Clock className="w-4 h-4 text-neutral-400" />
            {p.response_time_hours}h typical
          </span>
        ) : (
          <span className="text-neutral-300 text-sm">—</span>
        ),
    },
    {
      label: "Price Range",
      render: (p) => (
        <span className="text-neutral-700 text-sm">{formatPricing(p.pricing)}</span>
      ),
    },
    {
      label: "Coverage Area",
      render: (p) => (
        <span className="inline-flex items-center gap-1.5 text-neutral-600 text-sm">
          <MapPin className="w-4 h-4 flex-shrink-0 text-neutral-400" />
          {p.city ? `${p.city} — ` : ""}
          {formatCoverage(p.service_postcodes)}
        </span>
      ),
    },
    {
      label: "Qualifications",
      render: (p) =>
        p.accreditations.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {p.accreditations.map((acc, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium"
              >
                {acc.type}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-neutral-300 text-sm">—</span>
        ),
    },
  ];

  return (
    <div className="mt-2">
      {/* Horizontal scroll wrapper for mobile */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[640px] sm:min-w-0">
          {/* Provider header cards — sticky on scroll */}
          <div className="sticky top-0 z-20 bg-[#faf9f8] pt-2 pb-0">
            <div className="grid grid-cols-4 gap-0">
              {/* Label column header */}
              <div className="px-6 py-4 flex items-end">
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  Criteria
                </span>
              </div>

              {/* Provider columns */}
              {slots.map((provider, idx) =>
                provider ? (
                  <div
                    key={provider.id}
                    className="px-4 py-4 bg-white rounded-t-2xl shadow-sm mx-1 relative"
                  >
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => remove(provider.id)}
                      className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 transition-colors"
                      aria-label={`Remove ${provider.profiles.full_name} from comparison`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex flex-col items-center gap-3 text-center pr-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full ring-2 ring-brand-primary ring-offset-2 bg-neutral-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {provider.profiles.avatar_url ? (
                          <img
                            src={provider.profiles.avatar_url}
                            alt={provider.profiles.full_name ?? "Provider"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-neutral-400">
                            {provider.profiles.full_name?.charAt(0) ?? "?"}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3
                          className="font-heading font-semibold text-neutral-900 text-sm leading-tight"
                          style={{ letterSpacing: "-0.01em" }}
                        >
                          {provider.profiles.full_name}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">{provider.business_name}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={`empty-header-${idx}`} className="px-4 py-4 mx-1" />
                ),
              )}
            </div>
          </div>

          {/* Comparison rows */}
          <div className="rounded-b-2xl overflow-hidden">
            {rows.map((row, rowIdx) => (
              <div
                key={row.label}
                className={`grid grid-cols-4 gap-0 ${
                  rowIdx % 2 === 0 ? "bg-white" : "bg-[#f4f3f2]"
                }`}
              >
                {/* Label cell */}
                <div className="px-6 py-5 flex items-center">
                  <span className="text-sm font-semibold text-neutral-500">{row.label}</span>
                </div>

                {/* Provider data cells */}
                {slots.map((provider, idx) =>
                  provider ? (
                    <div
                      key={provider.id}
                      className="px-6 py-5 flex items-center justify-center mx-1 bg-white"
                    >
                      {row.render(provider)}
                    </div>
                  ) : (
                    <div key={`empty-${idx}`} className="px-6 py-5 mx-1" />
                  ),
                )}
              </div>
            ))}

            {/* Footer CTAs */}
            <div className="grid grid-cols-4 gap-0 bg-[#f4f3f2] rounded-b-2xl">
              <div className="px-6 py-6" />
              {slots.map((provider, idx) =>
                provider ? (
                  <div key={provider.id} className="px-4 py-6 flex flex-col items-center gap-2 mx-1 bg-white">
                    <Link
                      href={`/services/${provider.slug}`}
                      className="w-full px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-light transition-colors text-center min-h-[44px] flex items-center justify-center"
                    >
                      View Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(provider.id)}
                      className="text-xs text-neutral-400 hover:text-error transition-colors py-1"
                      aria-label={`Remove ${provider.profiles.full_name} from comparison`}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div key={`empty-footer-${idx}`} className="px-4 py-6 mx-1">
                    <Link
                      href="/services"
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 text-neutral-400 text-sm font-medium hover:bg-brand-primary-lighter hover:text-brand-primary transition-colors text-center min-h-[44px] flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Provider
                    </Link>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
