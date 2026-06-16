"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Search, SlidersHorizontal, TrendingUp, Users, Clock } from "lucide-react";
import type { AgentOffer, OfferStatus, AipStatus } from "@/types/agent";

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function offerStatusClasses(status: OfferStatus): string {
  if (status === "pending") return "bg-info/10 text-info";
  if (status === "accepted") return "bg-success/10 text-success";
  if (status === "rejected") return "bg-error/10 text-error";
  if (status === "countered") return "bg-warning/10 text-warning";
  return "bg-neutral-100 text-neutral-600";
}

function aipStatusClasses(status: AipStatus): string {
  if (status === "verified") return "bg-success/10 text-success";
  if (status === "provided") return "bg-warning/10 text-warning";
  return "bg-neutral-100 text-neutral-500";
}

function aipLabel(status: AipStatus): string {
  if (status === "verified") return "AIP Verified";
  if (status === "provided") return "AIP Provided";
  return "No AIP";
}

function buyerInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

/** Rank badge shown at the top of each offer card (TOP OFFER / NEGOTIATING / position). */
function rankBadge(rank: number, status: OfferStatus): React.ReactNode {
  if (rank === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-brand-primary px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
        Top Offer
      </span>
    );
  }
  if (status === "countered") {
    return (
      <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-warning">
        Negotiating
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
      #{rank + 1}
    </span>
  );
}

type OfferCardProps = Readonly<{
  offer: AgentOffer;
  rank: number;
}>;

function OfferCard({ offer, rank }: OfferCardProps) {
  const router = useRouter();

  function navigate() {
    router.push(`/dashboard/agent/offers/${offer.id}`);
  }

  return (
    <div
      className="flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
      onClick={navigate}
    >
      {/* rank + date row */}
      <div className="flex items-center justify-between gap-2">
        {rankBadge(rank, offer.status)}
        <span className="text-[11px] text-neutral-400">
          {new Date(offer.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* amount */}
      <p className="font-heading text-2xl font-bold tracking-tight text-brand-primary-dark">
        {formatGBP(offer.amount)}
      </p>

      {/* buyer type chips */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${aipStatusClasses(offer.aip_status)}`}
        >
          {aipLabel(offer.aip_status)}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${offerStatusClasses(offer.status)}`}
        >
          {offer.status}
        </span>
      </div>

      {/* buyer identity */}
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">
          {buyerInitial(offer.buyer_name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-900">
            {offer.buyer_name}
          </p>
          {offer.buyer_email && (
            <p className="truncate text-[11px] text-neutral-400">
              {offer.buyer_email}
            </p>
          )}
        </div>
      </div>

      {/* conditions excerpt */}
      {offer.conditions && (
        <p className="line-clamp-2 text-xs text-neutral-500 italic">
          &ldquo;{offer.conditions}&rdquo;
        </p>
      )}

    </div>
  );
}

type PropertyGroupProps = Readonly<{
  propertyId: string;
  offers: AgentOffer[];
}>;

function PropertyGroup({ propertyId, offers }: PropertyGroupProps) {
  const shortId = propertyId.slice(0, 8);

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      {/* property header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        {/* thumbnail placeholder */}
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
          <Building2 className="size-5 text-brand-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-neutral-900">
            Property {shortId}…
          </p>
          <p className="text-xs text-neutral-400">
            {offers.length} active offer{offers.length !== 1 ? "s" : ""}
          </p>
        </div>

      </div>

      {/* offers grid */}
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer, i) => (
          <OfferCard key={offer.id} offer={offer} rank={i} />
        ))}
      </div>
    </div>
  );
}

/** Aggregate stats derived purely from the filtered grouped offers. */
function PerformanceSummary({
  grouped,
}: Readonly<{ grouped: Record<string, AgentOffer[]> }>) {
  const allOffers = Object.values(grouped).flat();
  const total = allOffers.length;
  const accepted = allOffers.filter((o) => o.status === "accepted").length;
  const propertyCount = Object.keys(grouped).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* card 1 */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-brand-primary p-5 text-white">
        <TrendingUp className="size-8 shrink-0 opacity-80" />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-70">
            Performance Summary
          </p>
          <p className="font-heading text-2xl font-bold">
            {total > 0 ? `${Math.round((accepted / total) * 100)}%` : "—"}
          </p>
          <p className="text-xs opacity-70">of offers accepted</p>
        </div>
      </div>

      {/* card 2 */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
        <Users className="size-8 shrink-0 text-brand-primary/60" />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Active Listings
          </p>
          <p className="font-heading text-2xl font-bold text-brand-primary-dark">
            {propertyCount}
          </p>
          <p className="text-xs text-neutral-500">properties with offers</p>
        </div>
      </div>

      {/* card 3 */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
        <Clock className="size-8 shrink-0 text-brand-primary/60" />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Total Offers
          </p>
          <p className="font-heading text-2xl font-bold text-brand-primary-dark">
            {total}
          </p>
          <p className="text-xs text-neutral-500">across all listings</p>
        </div>
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
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by buyer name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-1.5 shrink-0">
          <SlidersHorizontal className="size-4" />
          Filter
        </Button>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-40 shrink-0">
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-16 text-center">
          <Building2 className="mb-3 size-10 text-neutral-300" />
          <p className="font-semibold text-neutral-700">No offers found</p>
          <p className="mt-1 text-sm text-neutral-400">
            {Object.keys(grouped).length === 0
              ? "No offers have been received yet."
              : "No offers match your current filters."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {Object.entries(filteredGrouped).map(([propertyId, offers]) => (
              <PropertyGroup
                key={propertyId}
                propertyId={propertyId}
                offers={offers}
              />
            ))}
          </div>

          {/* Performance summary strip */}
          <PerformanceSummary grouped={filteredGrouped} />
        </>
      )}
    </div>
  );
}
