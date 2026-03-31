"use client";

import Link from "next/link";
import Image from "next/image";
import { Building2, Clock, CheckCircle2, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Readonly<{
  listings: Record<string, unknown>[];
}>;

function formatGbp(value: unknown): string {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(num);
}

function getStr(listing: Record<string, unknown>, key: string): string {
  const v = listing[key];
  return typeof v === "string" ? v : "";
}

function getNum(listing: Record<string, unknown>, key: string): number {
  const v = listing[key];
  return typeof v === "number" ? v : 0;
}

function calcDaysOnMarket(listing: Record<string, unknown>): number {
  const created = getStr(listing, "created_at");
  const updated = getStr(listing, "updated_at");
  if (!created || !updated) return 0;
  const diff = new Date(updated).getTime() - new Date(created).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function SoldLetCard({ listing }: Readonly<{ listing: Record<string, unknown> }>) {
  const id = getStr(listing, "id");
  const title = getStr(listing, "title") || getStr(listing, "address_line_1") || "Untitled";
  const price = getNum(listing, "price");
  const status = getStr(listing, "status");
  const imageUrl = getStr(listing, "primary_image_url");
  const completionDate = getStr(listing, "completion_date") || getStr(listing, "updated_at");
  const daysOnMarket = calcDaysOnMarket(listing);
  const commission = getNum(listing, "commission_amount");
  const isSold = status === "sold";

  return (
    <Link
      href={`/dashboard/agent/listings/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:ring-border"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Building2 className="size-8" strokeWidth={1} />
            <span className="text-xs">No image</span>
          </div>
        )}
        {/* Status badge */}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
            isSold
              ? "bg-error/90 text-white"
              : "bg-success/90 text-white",
          )}
        >
          {isSold ? "Sold" : "Let"}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{title}</p>
        <p className="mt-1.5 font-heading text-xl font-bold tracking-tight text-foreground">
          {formatGbp(price)}
        </p>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {completionDate && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-600" strokeWidth={1.25} />
              {new Date(completionDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" strokeWidth={1.25} />
            {daysOnMarket} day{daysOnMarket !== 1 ? "s" : ""} on market
          </span>
        </div>

        {/* Commission */}
        {commission > 0 && (
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-warning-light px-3 py-2 dark:bg-amber-900/20">
            <Banknote className="size-3.5 text-warning dark:text-amber-400" strokeWidth={1.25} />
            <span className="text-xs font-semibold text-warning dark:text-amber-400">
              Commission: {formatGbp(commission)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl bg-card py-20 text-center shadow-sm ring-1 ring-border/60">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Building2 className="size-7 text-muted-foreground" strokeWidth={1.25} />
      </div>
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground">
          No sold or let listings yet
        </h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Completed sales and lettings will appear here once transactions are finalised.
        </p>
      </div>
    </div>
  );
}

export function SoldLetListings({ listings }: Props) {
  const soldCount = listings.filter((l) => getStr(l, "status") === "sold").length;
  const letCount = listings.filter((l) => getStr(l, "status") === "let").length;

  return (
    <div className="flex flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Listings
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground">
          Sold &amp; Let
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {soldCount} sold &middot; {letCount} let &middot; {listings.length} total
        </p>
      </div>

      {listings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <SoldLetCard key={getStr(listing, "id")} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
