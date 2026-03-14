"use client";

import { ShieldCheck, Clock, MapPin, Star, Plus } from "lucide-react";
import { useCompare } from "@/components/compare/useCompare";
import type { CompareProvider } from "@/types/providers";

type CompareTableProps = Readonly<{ providers: CompareProvider[] }>;

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function EmptySlot() {
  return (
    <td className="p-8 text-center align-top">
      <a
        href="/services"
        className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 hover:border-[#2563EB] transition-colors text-slate-400 hover:text-[#2563EB]"
      >
        <Plus className="w-8 h-8" />
        <span className="text-sm font-medium">Add a Provider</span>
      </a>
    </td>
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
      if (v.type === "hourly" && v.amount)
        return `From £${v.amount}/hr`;
      if (v.type === "fixed" && v.amount)
        return `Fixed £${v.amount}`;
      if (v.type === "quote")
        return "Quote on request";
    }
    return "Contact for pricing";
  }

  function formatCoverage(postcodes: string[]): string {
    if (postcodes.length === 0) return "—";
    const shown = postcodes.slice(0, 3).join(", ");
    return postcodes.length > 3 ? `${shown} +${postcodes.length - 3} more` : shown;
  }

  const rows: { label: string; render: (p: CompareProvider) => React.ReactNode }[] = [
    {
      label: "Overall Rating",
      render: (p) =>
        p.provider_rating_stats ? (
          <StarDisplay rating={p.provider_rating_stats.average_rating} />
        ) : (
          <span className="text-slate-400">No ratings yet</span>
        ),
    },
    {
      label: "Reviews",
      render: (p) => (
        <span className="text-slate-700 dark:text-slate-200 font-medium">
          {p.provider_rating_stats?.total_reviews ?? 0} reviews
        </span>
      ),
    },
    {
      label: "Verified",
      render: (p) =>
        p.profiles.provider_verification_status === "verified" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      label: "Response Time",
      render: (p) =>
        p.response_time_hours != null ? (
          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            {p.response_time_hours}h typical
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      label: "Price Range",
      render: (p) => (
        <span className="text-slate-700 dark:text-slate-200 text-sm">
          {formatPricing(p.pricing)}
        </span>
      ),
    },
    {
      label: "Coverage Area",
      render: (p) => (
        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-sm">
          <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
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
                className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium"
              >
                {acc.type}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0">
            <tr>
              <th className="w-1/4 p-6 text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Comparison Criteria
                </span>
              </th>
              {slots.map((provider, idx) =>
                provider ? (
                  <th key={provider.id} className="w-1/4 p-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                      {/* Avatar */}
                      <div className="w-24 h-24 rounded-full ring-2 ring-[#2563EB] ring-offset-2 bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                        {provider.profiles.avatar_url ? (
                          <img
                            src={provider.profiles.avatar_url}
                            alt={provider.profiles.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-slate-400">
                            {provider.profiles.full_name?.charAt(0) ?? "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                          {provider.profiles.full_name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {provider.business_name}
                        </p>
                      </div>
                    </div>
                  </th>
                ) : (
                  <th key={`empty-${idx}`} className="w-1/4 p-6" />
                ),
              )}
            </tr>
          </thead>

          {/* Body rows */}
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={row.label}
                className={
                  rowIdx % 2 === 0
                    ? "bg-white dark:bg-slate-900/30"
                    : "bg-slate-50/50 dark:bg-slate-800/20"
                }
              >
                <td className="p-6 text-sm font-semibold text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                  {row.label}
                </td>
                {slots.map((provider, idx) =>
                  provider ? (
                    <td
                      key={provider.id}
                      className="p-6 text-center align-middle"
                    >
                      {row.render(provider)}
                    </td>
                  ) : (
                    <EmptySlot key={`empty-${idx}`} />
                  ),
                )}
              </tr>
            ))}
          </tbody>

          {/* Footer CTAs */}
          <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
            <tr>
              <td className="p-6" />
              {slots.map((provider, idx) =>
                provider ? (
                  <td key={provider.id} className="p-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <a
                        href={`/services/${provider.slug}`}
                        className="w-full px-4 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors text-center"
                      >
                        View Profile
                      </a>
                      <button
                        onClick={() => remove(provider.id)}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                ) : (
                  <td key={`empty-footer-${idx}`} className="p-6" />
                ),
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
