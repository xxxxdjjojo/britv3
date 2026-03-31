"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Eye,
  Bookmark,
  Mail,
  BarChart3,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SortOption = "newest" | "price_high" | "price_low" | "most_views";

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

function statusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
    case "under_offer":
      return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
    case "for_sale":
      return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl bg-card py-20 text-center shadow-sm ring-1 ring-border/60">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Building2 className="size-7 text-muted-foreground" strokeWidth={1.25} />
      </div>
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground">No active listings</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Create your first listing to start attracting buyers and renters.
        </p>
      </div>
      <Button
        className="gap-2 bg-brand-primary text-white hover:bg-brand-primary-light"
        render={<Link href="/dashboard/agent/listings/create" />}
      >
        <Plus className="size-4" strokeWidth={1.5} />
        Create Listing
      </Button>
    </div>
  );
}

function ListingCard({ listing }: Readonly<{ listing: Record<string, unknown> }>) {
  const id = getStr(listing, "id");
  const title = getStr(listing, "title") || getStr(listing, "address_line_1") || "Untitled";
  const price = getNum(listing, "price");
  const status = getStr(listing, "status");
  const imageUrl = getStr(listing, "primary_image_url");
  const views = getNum(listing, "views");
  const saves = getNum(listing, "saves");
  const enquiries = getNum(listing, "enquiries");

  const statusLabel = status.replace(/_/g, " ");

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:ring-border">
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
        {status && (
          <span
            className={cn(
              "absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
              statusColor(status),
            )}
          >
            {statusLabel}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{title}</p>
        <p className="mt-1.5 font-heading text-xl font-bold tracking-tight text-foreground">
          {formatGbp(price)}
        </p>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" strokeWidth={1.25} />
            {views} views
          </span>
          <span className="flex items-center gap-1">
            <Bookmark className="size-3.5" strokeWidth={1.25} />
            {saves} saves
          </span>
          <span className="flex items-center gap-1">
            <Mail className="size-3.5" strokeWidth={1.25} />
            {enquiries}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4">
          <div className="mb-4 h-px bg-border/60" />
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/agent/listings/${id}/analytics`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              <BarChart3 className="size-3.5" strokeWidth={1.25} />
              Analytics
            </Link>
            <Link
              href={`/dashboard/agent/listings/${id}`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-primary/10 px-3 py-2 text-xs font-medium text-brand-primary transition-colors hover:bg-brand-primary/20"
            >
              View listing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActiveListings({ listings }: Props) {
  const [sort, setSort] = useState<SortOption>("newest");

  const sorted = useMemo(() => {
    const copy = [...listings];
    switch (sort) {
      case "price_high":
        return copy.sort((a, b) => getNum(b, "price") - getNum(a, "price"));
      case "price_low":
        return copy.sort((a, b) => getNum(a, "price") - getNum(b, "price"));
      case "most_views":
        return copy.sort((a, b) => getNum(b, "views") - getNum(a, "views"));
      default:
        return copy.sort(
          (a, b) =>
            new Date(getStr(b, "created_at")).getTime() -
            new Date(getStr(a, "created_at")).getTime(),
        );
    }
  }, [listings, sort]);

  return (
    <div className="flex flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Listings
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground">
            Active Listings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {listings.length} listing{listings.length !== 1 ? "s" : ""} currently on the market
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="size-4 text-muted-foreground" strokeWidth={1.25} />
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-40 rounded-xl bg-card shadow-sm ring-1 ring-border/60">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="most_views">Most Viewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            aria-label="Filter listings"
            className="flex size-10 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border/60 transition-colors hover:text-foreground"
          >
            <SlidersHorizontal className="size-4" strokeWidth={1.25} />
          </button>
          <Button
            className="gap-2 bg-brand-primary text-white shadow-sm hover:bg-brand-primary-light"
            render={<Link href="/dashboard/agent/listings/create" />}
          >
            <Plus className="size-4" strokeWidth={1.5} />
            New
          </Button>
        </div>
      </div>

      {/* Content */}
      {sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((listing) => (
            <ListingCard key={getStr(listing, "id")} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
