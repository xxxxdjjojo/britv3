"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import type { ListingWithStats } from "@/types/seller";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = Readonly<{
  listing: ListingWithStats;
  onArchive?: (id: string) => void;
}>;

function SparklineSVG({ values }: Readonly<{ values: number[] }>) {
  const max = Math.max(...values, 1);
  const width = 100;
  const height = 40;
  const points = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const d = points.length > 1 ? `M ${points.join(" L ")}` : "";
  return (
    <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="#1B4D3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-[--color-brand-primary-dark]/5 text-[--color-brand-primary-dark]",
  under_offer: "bg-[--color-brand-secondary-light] text-[--color-brand-secondary-dark]",
  sold: "bg-[--color-surface-container-high] text-zinc-500",
  draft: "bg-[--color-brand-accent-light] text-[--color-brand-accent]",
  paused: "bg-[--color-surface-container-high] text-zinc-500",
  archived: "bg-[--color-surface-container-high] text-zinc-400",
};

function formatStatusLabel(status: string) {
  return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Stable reference computed at module load time (avoids impure Date.now in render)
const NOW_MS = Date.now();

function getDaysAgo(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null;
  return Math.floor((NOW_MS - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

export function ListingCard({ listing, onArchive }: Props) {
  const thumb = listing.photos[0]?.url;
  const address = [listing.address_line_1, listing.city].filter(Boolean).join(", ");
  const price = listing.asking_price
    ? `£${(listing.asking_price / 100).toLocaleString("en-GB")}`
    : "POA";
  const listedDaysAgo = getDaysAgo(listing.created_at);

  return (
    <div className="group bg-white rounded-xl overflow-hidden flex items-stretch hover:shadow-[0_20px_50px_rgba(26,28,28,0.06)] transition-shadow duration-500">
      {/* Thumbnail */}
      <div className="w-64 xl:w-72 flex-shrink-0 overflow-hidden bg-[--color-surface-container-low]">
        {thumb ? (
          <img
            src={thumb}
            alt={address}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-zinc-300 min-h-[180px]">
            <Home size={32} strokeWidth={1} />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="flex-1 p-6 xl:p-8 flex flex-col justify-between">
        {/* Top row */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span
                className={cn(
                  "text-[10px] font-bold tracking-[0.05em] px-2 py-0.5 rounded uppercase",
                  STATUS_BADGE[listing.status] ?? "bg-[--color-surface-container-high] text-zinc-500"
                )}
              >
                {formatStatusLabel(listing.status)}
              </span>
              {listedDaysAgo !== null && (
                <span className="text-[10px] text-zinc-400 font-medium tracking-[0.05em] uppercase">
                  Listed {listedDaysAgo} {listedDaysAgo === 1 ? "day" : "days"} ago
                </span>
              )}
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[--color-on-surface] mb-1 leading-tight">
              {address}
            </h3>
            <p className="text-zinc-500 text-sm flex items-center gap-1">
              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              {listing.postcode}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl text-[--color-brand-primary-dark] leading-tight">
              {price}
            </p>
            {listing.tenure && (
              <p className="text-xs text-zinc-400 font-medium capitalize mt-0.5">
                {listing.tenure}
              </p>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-8 py-5 border-y border-[--color-surface-container-high]/60 my-4">
          <div>
            <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mb-1">Views</p>
            <p className="text-lg font-['Plus_Jakarta_Sans'] font-bold text-[--color-on-surface]">
              {listing.views_count >= 1000
                ? `${(listing.views_count / 1000).toFixed(1)}k`
                : listing.views_count}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mb-1">Saves</p>
            <p className="text-lg font-['Plus_Jakarta_Sans'] font-bold text-[--color-on-surface]">
              {listing.saves_count}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mb-1">Enquiries</p>
            <p className="text-lg font-['Plus_Jakarta_Sans'] font-bold text-[--color-on-surface]">
              {listing.enquiries_count}
            </p>
          </div>
          <div className="relative h-12">
            <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase absolute -top-5 right-0">Trend</p>
            <SparklineSVG values={listing.weekly_views} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-5">
            {listing.bedrooms && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
                </svg>
                {listing.bedrooms} Beds
              </div>
            )}
            {listing.property_type && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 capitalize">
                {listing.property_type.replace("-", " ")}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/seller/listings/${listing.id}/analytics`}
              className="px-5 py-2 bg-[--color-brand-secondary-light] text-[--color-brand-secondary-dark] text-xs font-bold rounded hover:opacity-90 transition-opacity"
            >
              View Analytics
            </Link>
            <Link
              href={`/dashboard/seller/listings/${listing.id}/edit`}
              className="px-5 py-2 bg-[--color-brand-primary-dark] text-white text-xs font-bold rounded hover:opacity-90 transition-opacity"
            >
              Edit
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-9 h-9 flex items-center justify-center rounded border border-[--color-surface-container-high] hover:bg-[--color-surface-container-low] transition-colors">
                <svg className="w-4 h-4 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/seller/listings/${listing.id}/edit`}>Edit Listing</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/seller/listings/${listing.id}/analytics`}>Analytics</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[--color-error]"
                  onClick={() => onArchive?.(listing.id)}
                >
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
