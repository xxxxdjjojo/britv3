"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Search, TrendingUp } from "lucide-react";
import type { AgentOffer, OfferStatus, AipStatus } from "@/types/agent";

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function offerStatusConfig(status: OfferStatus): { bg: string; text: string; label: string } {
  switch (status) {
    case "pending":
      return { bg: "bg-info-light", text: "text-info", label: "Pending" };
    case "accepted":
      return { bg: "bg-success-light", text: "text-success", label: "Accepted" };
    case "rejected":
      return { bg: "bg-error-light", text: "text-error", label: "Rejected" };
    case "countered":
      return { bg: "bg-warning-light", text: "text-warning", label: "Countered" };
    case "withdrawn":
      return { bg: "bg-neutral-100", text: "text-neutral-500", label: "Withdrawn" };
    default:
      return { bg: "bg-neutral-100", text: "text-neutral-500", label: status };
  }
}

function aipStatusConfig(status: AipStatus): { bg: string; text: string; label: string } {
  switch (status) {
    case "verified":
      return { bg: "bg-success-light", text: "text-success", label: "AIP Verified" };
    case "provided":
      return { bg: "bg-warning-light", text: "text-warning", label: "AIP Provided" };
    default:
      return { bg: "bg-neutral-100", text: "text-neutral-500", label: "No AIP" };
  }
}

function StatusPill({ bg, text, label }: Readonly<{ bg: string; text: string; label: string }>) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bg} ${text}`}
    >
      {label}
    </span>
  );
}

function OfferCard({ offer }: Readonly<{ offer: AgentOffer }>) {
  const router = useRouter();
  const statusCfg = offerStatusConfig(offer.status);
  const aipCfg = aipStatusConfig(offer.aip_status);

  return (
    <div
      className="group flex cursor-pointer flex-wrap items-start justify-between gap-4 rounded-xl bg-neutral-50 p-4 transition-all hover:bg-brand-primary-lighter hover:shadow-sm active:scale-[0.99]"
      onClick={() => router.push(`/dashboard/agent/offers/${offer.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/dashboard/agent/offers/${offer.id}`)}
    >
      <div className="min-w-0">
        <p className="font-semibold text-neutral-900 group-hover:text-brand-primary">
          {offer.buyer_name}
        </p>
        {offer.buyer_email && (
          <p className="mt-0.5 text-xs text-neutral-500">{offer.buyer_email}</p>
        )}
        <p className="mt-1.5 text-xs text-neutral-400">
          {new Date(offer.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xl font-bold tracking-tight text-neutral-900">
          {formatGBP(offer.amount)}
        </span>
        <StatusPill {...aipCfg} />
        <StatusPill {...statusCfg} />
      </div>
    </div>
  );
}

type StatusFilter = "all" | OfferStatus;

export function OffersDashboard({
  grouped,
}: Readonly<{ grouped: Record<string, AgentOffer[]> }>) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const filteredGrouped = useMemo(() => {
    const result: Record<string, AgentOffer[]> = {};

    for (const [propertyId, offers] of Object.entries(grouped)) {
      const filtered = offers.filter((o) => {
        const matchesStatus =
          statusFilter === "all" || o.status === statusFilter;
        const matchesSearch =
          search.trim() === "" ||
          o.buyer_name.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
      });

      if (filtered.length > 0) {
        result[propertyId] = filtered;
      }
    }

    return result;
  }, [grouped, statusFilter, search]);

  const totalOffers = Object.values(filteredGrouped).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            className="rounded-lg bg-neutral-50 pl-9 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-brand-primary"
            placeholder="Search by buyer name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-44 rounded-lg bg-neutral-50 text-neutral-700">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="countered">Countered</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {totalOffers === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-neutral-50 py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-primary-lighter">
            <Building2 className="size-7 text-brand-primary" />
          </div>
          <p className="font-semibold text-neutral-900">No offers found</p>
          <p className="mt-1 text-sm text-neutral-500">
            {Object.keys(grouped).length === 0
              ? "No offers have been received yet."
              : "No offers match your current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredGrouped).map(([propertyId, offers]) => (
            <div
              key={propertyId}
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              {/* Property header */}
              <div className="flex items-center justify-between gap-2 bg-neutral-50 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-brand-primary-lighter">
                    <Building2 className="size-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                      Property
                    </p>
                    <p className="font-mono text-sm font-semibold text-neutral-800">
                      {propertyId.slice(0, 8)}…
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-3.5 text-brand-primary" />
                  <span className="text-sm font-semibold text-brand-primary">
                    {offers.length} offer{offers.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Offer list */}
              <div className="divide-y divide-neutral-100 p-3 space-y-1">
                {offers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
