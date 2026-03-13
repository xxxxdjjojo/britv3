"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { AgentOffer, OfferStatus } from "@/types/agent";
import { OFFER_STATUSES } from "@/types/agent";

const STATUS_STYLES: Record<OfferStatus, string> = {
  pending: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  countered: "bg-orange-100 text-orange-700",
  withdrawn: "bg-gray-100 text-gray-600",
};

const AIP_STYLES: Record<string, string> = {
  not_provided: "bg-gray-100 text-gray-600",
  provided: "bg-amber-100 text-amber-700",
  verified: "bg-green-100 text-green-700",
};

const AIP_LABELS: Record<string, string> = {
  not_provided: "AIP: Not Provided",
  provided: "AIP: Provided",
  verified: "AIP: Verified",
};

function formatGBP(amountPence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amountPence / 100);
}

export function OffersDashboard(
  props: Readonly<{ initialOffers: AgentOffer[] }>,
) {
  const [statusFilter, setStatusFilter] = useState<OfferStatus | "all">("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return props.initialOffers;
    return props.initialOffers.filter((o) => o.status === statusFilter);
  }, [props.initialOffers, statusFilter]);

  // Group by property_id
  const grouped = useMemo(() => {
    const map = new Map<string, AgentOffer[]>();
    for (const offer of filtered) {
      const existing = map.get(offer.property_id) ?? [];
      existing.push(offer);
      map.set(offer.property_id, existing);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offers Dashboard</h1>
          <p className="text-muted-foreground">
            Track and manage offers across your properties
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Filter by status:
        </label>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as OfferStatus | "all")
          }
          className="rounded border px-3 py-1.5 text-sm dark:bg-gray-800"
        >
          <option value="all">All Statuses</option>
          {OFFER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          {filtered.length} offer{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grouped offers */}
      {grouped.length === 0 ? (
        <p className="text-sm text-gray-500">No offers found.</p>
      ) : (
        grouped.map(([propertyId, offers]) => (
          <div
            key={propertyId}
            className="rounded-lg border bg-white dark:bg-gray-900"
          >
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-semibold">
                Property: {propertyId.slice(0, 8)}...
              </h3>
              <p className="text-xs text-gray-500">
                {offers.length} offer{offers.length !== 1 ? "s" : ""}
              </p>
            </div>
            <ul className="divide-y">
              {offers.map((offer) => (
                <li key={offer.id}>
                  <Link
                    href={`/dashboard/agent/offers/${offer.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div>
                      <p className="text-sm font-medium">{offer.buyer_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(offer.created_at).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {formatGBP(offer.amount)}
                      </span>
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          AIP_STYLES[offer.aip_status] ?? "bg-gray-100 text-gray-600",
                        ].join(" ")}
                      >
                        {AIP_LABELS[offer.aip_status] ?? offer.aip_status}
                      </span>
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_STYLES[offer.status],
                        ].join(" ")}
                      >
                        {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
