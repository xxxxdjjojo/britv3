"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { AgentOffer, OfferStatus, AipStatus } from "@/types/agent";
import { Building2, Search, SortAsc, SortDesc } from "lucide-react";

// ============================================================================
// Helpers
// ============================================================================

function formatGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ============================================================================
// Status badge configs
// ============================================================================

const STATUS_CONFIG: Record<OfferStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  countered: { label: "Countered", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  withdrawn: { label: "Withdrawn", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const AIP_CONFIG: Record<AipStatus, { label: string; className: string }> = {
  not_provided: { label: "No AIP", className: "bg-gray-100 text-gray-600" },
  provided: { label: "AIP Provided", className: "bg-yellow-100 text-yellow-800" },
  verified: { label: "AIP Verified", className: "bg-green-100 text-green-800" },
};

// ============================================================================
// Offer card
// ============================================================================

type OfferCardProps = Readonly<{
  offer: AgentOffer;
  onClick: () => void;
}>;

function OfferCard({ offer, onClick }: OfferCardProps) {
  const statusCfg = STATUS_CONFIG[offer.status];
  const aipCfg = AIP_CONFIG[offer.aip_status];

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left border rounded-lg p-4 hover:bg-muted transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-base truncate">{offer.buyer_name}</p>
          <p className="text-xl font-bold mt-0.5">{formatGBP(offer.amount)}</p>
          {offer.counter_amount && (
            <p className="text-sm text-orange-600">
              Counter: {formatGBP(offer.counter_amount)}
            </p>
          )}
          {offer.conditions && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {offer.conditions}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}>
            {statusCfg.label}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${aipCfg.className}`}>
            {aipCfg.label}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{formatDate(offer.created_at)}</p>
    </button>
  );
}

// ============================================================================
// Property group
// ============================================================================

type PropertyGroupProps = Readonly<{
  propertyId: string;
  offers: AgentOffer[];
  onOfferClick: (offerId: string) => void;
}>;

function PropertyGroup({ propertyId, offers, onOfferClick }: PropertyGroupProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="size-4 text-muted-foreground" />
          <span className="font-mono text-sm">{propertyId.slice(0, 8)}…</span>
          <Badge variant="secondary">{offers.length} offer{offers.length !== 1 ? "s" : ""}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onClick={() => onOfferClick(offer.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main OffersDashboard
// ============================================================================

type SortField = "amount_desc" | "amount_asc" | "date_desc";

type OffersDashboardProps = Readonly<{
  initialOffers: AgentOffer[];
  agentId: string;
}>;

export function OffersDashboard({ initialOffers, agentId }: OffersDashboardProps) {
  const router = useRouter();
  const [offers, setOffers] = useState<AgentOffer[]>(initialOffers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OfferStatus | "all">("all");
  const [sortField, setSortField] = useState<SortField>("date_desc");

  // Supabase Realtime subscription for new offers
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("offers-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_offers",
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          // Refresh offers on any change
          void fetch("/api/agent/offers")
            .then((r) => r.json() as Promise<{ offers?: AgentOffer[] }>)
            .then((data) => {
              if (data.offers) setOffers(data.offers);
            });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [agentId]);

  // Filter and sort
  const filtered = offers
    .filter((o) => {
      const matchesSearch =
        !search ||
        o.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
        (o.buyer_email ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === "amount_desc") return b.amount - a.amount;
      if (sortField === "amount_asc") return a.amount - b.amount;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Group by property
  const grouped = new Map<string, AgentOffer[]>();
  for (const offer of filtered) {
    const group = grouped.get(offer.property_id) ?? [];
    group.push(offer);
    grouped.set(offer.property_id, group);
  }

  const totalPending = offers.filter((o) => o.status === "pending").length;
  const totalAccepted = offers.filter((o) => o.status === "accepted").length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total offers</p>
            <p className="text-3xl font-bold">{offers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold text-blue-600">{totalPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Accepted</p>
            <p className="text-3xl font-bold text-green-600">{totalAccepted}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by buyer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as OfferStatus | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
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
        <Select
          value={sortField}
          onValueChange={(v) => setSortField(v as SortField)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">
              <div className="flex items-center gap-1">
                <SortDesc className="size-3" />
                Newest first
              </div>
            </SelectItem>
            <SelectItem value="amount_desc">
              <div className="flex items-center gap-1">
                <SortDesc className="size-3" />
                Highest amount
              </div>
            </SelectItem>
            <SelectItem value="amount_asc">
              <div className="flex items-center gap-1">
                <SortAsc className="size-3" />
                Lowest amount
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property groups */}
      {grouped.size === 0 ? (
        <div className="text-center py-12">
          <Building2 className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No offers found matching your filters.</p>
          {offers.length === 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Offers submitted by buyers will appear here.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([propertyId, propertyOffers]) => (
            <PropertyGroup
              key={propertyId}
              propertyId={propertyId}
              offers={propertyOffers}
              onOfferClick={(id) => router.push(`/dashboard/agent/offers/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
