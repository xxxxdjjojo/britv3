"use client";

import Link from "next/link";
import { Eye, Heart, MessageSquare, Edit2, MoreVertical, Home } from "lucide-react";
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

function MiniBarChart({ values }: Readonly<{ values: number[] }>) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-10">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-2.5 bg-[--color-brand-primary-lighter] rounded-sm hover:bg-[--color-brand-primary]/30 transition-colors"
          style={{ height: `${Math.max(4, (v / max) * 40)}px` }}
        />
      ))}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-[--color-success-light] text-[--color-success]",
  under_offer: "bg-[--color-warning-light] text-[--color-warning]",
  sold: "bg-[--color-neutral-100] text-[--color-neutral-600]",
  draft: "bg-[--color-info-light] text-[--color-info]",
  paused: "bg-[--color-warning-light] text-[--color-warning]",
  archived: "bg-[--color-neutral-100] text-[--color-neutral-400]",
};

export function ListingCard({ listing, onArchive }: Props) {
  const thumb = listing.photos[0]?.url;
  const address = [listing.address_line_1, listing.city].filter(Boolean).join(", ");
  const price = listing.asking_price
    ? `£${(listing.asking_price / 100).toLocaleString("en-GB")}`
    : "POA";

  return (
    <div className="group flex bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Thumbnail */}
      <div className="relative w-64 flex-shrink-0 overflow-hidden bg-[--color-neutral-100]">
        {thumb ? (
          <img
            src={thumb}
            alt={address}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[--color-neutral-300]">
            <Home size={32} strokeWidth={1.25} />
          </div>
        )}
        <span className={cn(
          "absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
          STATUS_STYLES[listing.status] ?? "bg-[--color-neutral-100] text-[--color-neutral-500]",
        )}>
          {listing.status.replace("_", " ")}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 p-6">
        <p className="text-xs text-[--color-neutral-400] font-medium font-inter">{listing.postcode}</p>
        <h3 className="text-base font-semibold text-[--color-neutral-900] mt-0.5 font-['Plus_Jakarta_Sans']">{address}</h3>
        <p className="text-2xl font-bold text-[--color-neutral-900] mt-2 font-['Plus_Jakarta_Sans'] tracking-tight">{price}</p>
        {listing.bedrooms && (
          <p className="text-sm text-[--color-neutral-400] mt-1 font-inter">
            {listing.bedrooms} bed · {listing.bathrooms ?? "–"} bath · {listing.property_type}
          </p>
        )}
        <div className="flex items-center gap-5 mt-4">
          <span className="flex items-center gap-1.5 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[--color-info-light]">
              <Eye size={12} className="text-[--color-info]" strokeWidth={1.25} />
            </span>
            <span className="font-semibold text-[--color-neutral-800] font-inter">{listing.views_count}</span>
            <span className="text-[--color-neutral-400] text-xs font-inter">views</span>
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-50">
              <Heart size={12} className="text-pink-500" strokeWidth={1.25} />
            </span>
            <span className="font-semibold text-[--color-neutral-800] font-inter">{listing.saves_count}</span>
            <span className="text-[--color-neutral-400] text-xs font-inter">saves</span>
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[--color-warning-light]">
              <MessageSquare size={12} className="text-[--color-warning]" strokeWidth={1.25} />
            </span>
            <span className="font-semibold text-[--color-neutral-800] font-inter">{listing.enquiries_count}</span>
            <span className="text-[--color-neutral-400] text-xs font-inter">enquiries</span>
          </span>
        </div>
      </div>

      {/* Side Panel */}
      <div className="bg-[--color-neutral-50] flex flex-col items-center justify-between px-5 py-6 min-w-[140px]">
        <MiniBarChart values={listing.weekly_views} />
        <p className="text-xs text-[--color-neutral-400] mt-2 mb-4 font-inter">Last 7 days</p>
        <div className="flex flex-col gap-2 w-full">
          <Link
            href={`/dashboard/seller/listings/${listing.id}/edit`}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[--color-brand-primary] text-white text-xs font-semibold hover:bg-[--color-brand-primary-light] transition-colors font-inter"
          >
            <Edit2 size={12} strokeWidth={1.25} /> Edit
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[--color-neutral-100] text-[--color-neutral-600] text-xs font-semibold hover:bg-[--color-neutral-200] transition-colors w-full font-inter">
              <MoreVertical size={12} strokeWidth={1.25} /> More
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/seller/listings/${listing.id}/analytics`}>Analytics</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[--color-error]" onClick={() => onArchive?.(listing.id)}>
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
