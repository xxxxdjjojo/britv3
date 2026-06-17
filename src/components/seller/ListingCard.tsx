"use client";

import Link from "next/link";
import { Eye, Heart, MessageSquare, Edit2, Archive, MoreVertical } from "lucide-react";
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
          className="w-3 bg-brand-primary/20 rounded-sm hover:bg-brand-primary/40 transition-colors"
          style={{ height: `${Math.max(4, (v / max) * 40)}px` }}
        />
      ))}
    </div>
  );
}

export function ListingCard({ listing, onArchive }: Props) {
  const thumb = listing.photos[0]?.url;
  const address = [listing.address_line_1, listing.city].filter(Boolean).join(", ");
  const price = listing.asking_price
    ? `£${(listing.asking_price / 100).toLocaleString("en-GB")}`
    : "POA";

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    under_offer: "bg-amber-100 text-amber-700",
    sold: "bg-muted text-slate-600",
    draft: "bg-blue-100 text-blue-700",
    paused: "bg-orange-100 text-orange-700",
    archived: "bg-muted text-slate-400",
  };

  return (
    <div className="group flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative w-72 h-48 flex-shrink-0 overflow-hidden bg-muted">
        {thumb ? (
          <img
            src={thumb}
            alt={address}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-300">
            <Eye size={32} />
          </div>
        )}
        <span className={cn(
          "absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
          STATUS_COLORS[listing.status] ?? "bg-muted text-slate-500",
        )}>
          {listing.status.replace("_", " ")}
        </span>
      </div>
      <div className="flex-1 p-6">
        <p className="text-xs text-slate-500 font-medium">{listing.postcode}</p>
        <h3 className="text-base font-bold text-slate-900 mt-0.5">{address}</h3>
        <p className="text-2xl font-black text-slate-900 mt-2">{price}</p>
        {listing.bedrooms && (
          <p className="text-sm text-slate-500 mt-1">
            {listing.bedrooms} bed · {listing.bathrooms ?? "–"} bath · {listing.property_type}
          </p>
        )}
        <div className="flex items-center gap-4 mt-4">
          <span className="flex items-center gap-1.5 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
              <Eye size={12} className="text-blue-600" />
            </span>
            <span className="font-semibold text-slate-700">{listing.views_count}</span>
            <span className="text-slate-400 text-xs">views</span>
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-100">
              <Heart size={12} className="text-pink-500" />
            </span>
            <span className="font-semibold text-slate-700">{listing.saves_count}</span>
            <span className="text-slate-400 text-xs">saves</span>
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100">
              <MessageSquare size={12} className="text-orange-500" />
            </span>
            <span className="font-semibold text-slate-700">{listing.enquiries_count}</span>
            <span className="text-slate-400 text-xs">enquiries</span>
          </span>
        </div>
      </div>
      <div className="border-l border-slate-100 flex flex-col items-center justify-between px-5 py-6 min-w-[140px]">
        <MiniBarChart values={listing.weekly_views} />
        <p className="text-xs text-slate-400 mt-2 mb-4">Last 7 days</p>
        <div className="flex flex-col gap-2 w-full">
          <Link
            href={`/dashboard/seller/listings/${listing.id}/edit`}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-light transition-colors"
          >
            <Edit2 size={12} /> Edit
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-surface transition-colors w-full">
              <MoreVertical size={12} /> More
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/seller/listings/${listing.id}/analytics`}>Analytics</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onArchive?.(listing.id)}>
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
