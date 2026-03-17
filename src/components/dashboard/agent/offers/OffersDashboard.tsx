"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Building2, Search } from "lucide-react";
import type { AgentOffer, OfferStatus, AipStatus } from "@/types/agent";

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function offerStatusClass(status: OfferStatus): string {
  if (status === "pending") return "bg-blue-100 text-blue-700";
  if (status === "accepted") return "bg-green-100 text-green-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  if (status === "countered") return "bg-orange-100 text-orange-700";
  return "bg-neutral-100 text-neutral-600";
}

function aipStatusClass(status: AipStatus): string {
  if (status === "verified") return "bg-green-100 text-green-700";
  if (status === "provided") return "bg-yellow-100 text-yellow-700";
  return "bg-neutral-100 text-neutral-500";
}

function aipLabel(status: AipStatus): string {
  if (status === "verified") return "AIP Verified";
  if (status === "provided") return "AIP Provided";
  return "No AIP";
}

function OfferCard({ offer }: Readonly<{ offer: AgentOffer }>) {
  const router = useRouter();

  return (
    <div
      className="flex cursor-pointer flex-wrap items-start justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40"
      onClick={() => router.push(`/dashboard/agent/offers/${offer.id}`)}
    >
      <div className="min-w-0">
        <p className="font-medium">{offer.buyer_name}</p>
        {offer.buyer_email && (
          <p className="text-xs text-muted-foreground">{offer.buyer_email}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(offer.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg font-bold">{formatGBP(offer.amount)}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${aipStatusClass(offer.aip_status)}`}
        >
          {aipLabel(offer.aip_status)}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${offerStatusClass(offer.status)}`}
        >
          {offer.status}
        </span>
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
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by buyer name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-40">
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="mb-3 size-10 text-muted-foreground" />
            <p className="font-medium">No offers found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {Object.keys(grouped).length === 0
                ? "No offers have been received yet."
                : "No offers match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredGrouped).map(([propertyId, offers]) => (
            <Card key={propertyId}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="size-4 text-muted-foreground" />
                  Property: {propertyId.slice(0, 8)}…
                  <Badge variant="secondary" className="ml-auto">
                    {offers.length} offer{offers.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {offers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
