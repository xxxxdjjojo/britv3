"use client";

import { ShieldCheck, Clock, MapPin, Star, Plus, X } from "lucide-react";
import { useCompare } from "@/components/compare/useCompare";
import type { CompareProvider } from "@/types/providers";

type CompareTableProps = Readonly<{ providers: CompareProvider[] }>;

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= Math.round(rating)
              ? "fill-brand-secondary text-brand-secondary"
              : "fill-[#e3e2e1] text-[#e3e2e1]"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-[#1a1c1c]">
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
        className="flex flex-col items-center gap-3 rounded-2xl p-8 bg-[#f4f3f2] hover:bg-[#e3e2e1] transition-colors group"
      >
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
          <Plus className="w-5 h-5 text-brand-primary" />
        </div>
        <span className="text-sm font-medium text-[#404945]">Add a Provider</span>
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
          <span className="text-[#404945]/50 text-sm">No ratings yet</span>
        ),
    },
    {
      label: "Reviews",
      render: (p) => (
        <span className="text-[#1a1c1c] font-semibold text-sm">
          {p.provider_rating_stats?.total_reviews ?? 0} reviews
        </span>
      ),
    },
    {
      label: "Verified",
      render: (p) =>
        p.profiles.provider_verification_status === "verified" ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified
          </span>
        ) : (
          <span className="text-[#404945]/50 text-sm">—</span>
        ),
    },
    {
      label: "Response Time",
      render: (p) =>
        p.response_time_hours != null ? (
          <span className="inline-flex items-center gap-1.5 text-[#404945] text-sm">
            <Clock className="w-4 h-4 text-[#404945]/50" />
            {p.response_time_hours}h typical
          </span>
        ) : (
          <span className="text-[#404945]/50 text-sm">—</span>
        ),
    },
    {
      label: "Price Range",
      render: (p) => (
        <span className="text-[#1a1c1c] text-sm font-medium">
          {formatPricing(p.pricing)}
        </span>
      ),
    },
    {
      label: "Coverage Area",
      render: (p) => (
        <span className="inline-flex items-center gap-1.5 text-[#404945] text-sm">
          <MapPin className="w-4 h-4 flex-shrink-0 text-[#404945]/50" />
          {p.city ? `${p.city} — ` : ""}
          {formatCoverage(p.service_postcodes)}
        </span>
      ),
    },
    {
      label: "Qualifications",
      render: (p) =>
        p.accreditations.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {p.accreditations.map((acc, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-full bg-[#f4f3f2] text-[#404945] text-xs font-medium"
              >
                {acc.type}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[#404945]/50 text-sm">—</span>
        ),
    },
  ];

  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead className="bg-[#faf9f8] border-b border-[#e3e2e1]">
            <tr>
              <th className="w-1/4 p-6 text-left">
                <span className="text-xs font-bold uppercase tracking-widest text-[#404945]/60">
                  Criteria
                </span>
              </th>
              {slots.map((provider, idx) =>
                provider ? (
                  <th key={provider.id} className="w-1/4 p-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                      {/* Avatar */}
                      <div className="w-20 h-20 rounded-full ring-2 ring-brand-primary ring-offset-2 bg-[#f4f3f2] overflow-hidden flex items-center justify-center">
                        {provider.profiles.avatar_url ? (
                          <img
                            src={provider.profiles.avatar_url}
                            alt={provider.profiles.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-brand-primary">
                            {provider.profiles.full_name?.charAt(0) ?? "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-[#1a1c1c] text-sm">
                          {provider.profiles.full_name}
                        </h3>
                        <p className="text-xs text-[#404945] mt-0.5">
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
                    ? "bg-white"
                    : "bg-[#faf9f8]"
                }
              >
                <td className="p-6 text-sm font-semibold text-[#404945] border-r border-[#e3e2e1]">
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
          <tfoot className="bg-[#faf9f8] border-t border-[#e3e2e1]">
            <tr>
              <td className="p-6" />
              {slots.map((provider, idx) =>
                provider ? (
                  <td key={provider.id} className="p-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <a
                        href={`/services/${provider.slug}`}
                        className="w-full px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 transition-colors text-center"
                      >
                        View Profile
                      </a>
                      <button
                        onClick={() => remove(provider.id)}
                        className="inline-flex items-center gap-1 text-xs text-[#404945]/60 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
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
