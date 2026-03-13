"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, CalendarCheck, Clock } from "lucide-react";

const formatGBP = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function ListingCard(
  props: Readonly<{ listing: Record<string, unknown> }>,
) {
  const { listing } = props;
  const address = String(listing.address_line_1 ?? listing.title ?? "Untitled");
  const city = listing.city ? `, ${String(listing.city)}` : "";
  const price = Number(listing.price ?? 0);
  const status = String(listing.status ?? "sold");
  const createdAt = String(listing.created_at ?? "");
  const updatedAt = String(listing.updated_at ?? listing.completed_at ?? "");
  const timeOnMarket = createdAt && updatedAt
    ? daysBetween(createdAt, updatedAt)
    : 0;

  return (
    <Card>
      <div className="flex h-32 items-center justify-center rounded-t-lg bg-muted">
        <Home className="size-8 text-muted-foreground" />
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold">
            {address}
            {city}
          </p>
          <Badge
            variant={status === "sold" ? "default" : "secondary"}
            className="shrink-0 capitalize"
          >
            {status}
          </Badge>
        </div>

        <p className="text-lg font-bold">
          {price > 0 ? formatGBP(price) : "N/A"}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {timeOnMarket} days on market
          </span>
          {updatedAt && (
            <span className="flex items-center gap-1">
              <CalendarCheck className="size-3" />
              {new Date(updatedAt).toLocaleDateString("en-GB")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SoldLetListings(
  props: Readonly<{
    soldListings: Record<string, unknown>[];
    letListings: Record<string, unknown>[];
  }>,
) {
  const [tab, setTab] = useState("sold");

  const current = tab === "sold" ? props.soldListings : props.letListings;
  const label = tab === "sold" ? "Sold" : "Let";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sold & Let</h1>
        <p className="text-muted-foreground">
          Properties that have completed
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="sold">
            Sold ({props.soldListings.length})
          </TabsTrigger>
          <TabsTrigger value="let">
            Let ({props.letListings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sold" className="mt-4">
          {props.soldListings.length === 0 ? (
            <EmptyState label="sold" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {props.soldListings.map((l) => (
                <ListingCard key={String(l.id)} listing={l} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="let" className="mt-4">
          {props.letListings.length === 0 ? (
            <EmptyState label="let" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {props.letListings.map((l) => (
                <ListingCard key={String(l.id)} listing={l} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState(props: Readonly<{ label: string }>) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Home className="mb-4 size-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No {props.label} properties</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Completed {props.label} properties will appear here.
        </p>
      </CardContent>
    </Card>
  );
}
