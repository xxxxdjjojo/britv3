"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { ProviderService, PricingType } from "@/types/provider-dashboard";

type ServiceCardProps = Readonly<{
  service: ProviderService;
  onEdit: (service: ProviderService) => void;
  onDelete: (id: string) => void;
}>;

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  gas: "Gas",
  carpentry: "Carpentry",
  plastering: "Plastering",
  painting: "Painting",
  roofing: "Roofing",
  flooring: "Flooring",
  landscaping: "Landscaping",
  general_maintenance: "General Maintenance",
  cleaning: "Cleaning",
  moving: "Moving",
  conveyancing: "Conveyancing",
  surveying: "Surveying",
  mortgage_advice: "Mortgage Advice",
};

function formatPricing(type: PricingType, amount: number | null): string {
  if (type === "quote_on_request") return "Quote on Request";
  if (amount === null) return "—";
  const formatted = `£${(amount / 100).toFixed(0)}`;
  if (type === "hourly") return `${formatted}/hr`;
  return formatted; // fixed
}

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        {/* Left: name + category + pricing */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-neutral-900">
            {service.name}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {/* Category pill */}
            <span className="rounded-full bg-[#E8F5EE] px-2.5 py-0.5 text-xs font-semibold text-brand-primary">
              {CATEGORY_LABELS[service.category] ?? service.category}
            </span>

            {/* Pricing */}
            <span
              className={[
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                service.pricing_type === "quote_on_request"
                  ? "bg-neutral-100 text-neutral-600"
                  : "bg-blue-50 text-blue-700",
              ].join(" ")}
            >
              {formatPricing(service.pricing_type, service.price_amount)}
            </span>
          </div>

          {service.description && (
            <p className="mt-2 line-clamp-2 text-sm text-neutral-500">
              {service.description}
            </p>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={`Edit ${service.name}`}
            onClick={() => onEdit(service)}
            className="flex size-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${service.name}`}
            onClick={() => onDelete(service.id)}
            className="flex size-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
