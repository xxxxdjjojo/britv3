/**
 * ListingsTab — Server Component
 *
 * Renders a 2-column grid of PropertyCards for an agent's active listings
 * (status: for_sale, for_rent, under_offer). Matches the agency-public-profile
 * Stitch reference design.
 */

import Image from "next/image";
import { Bed, Bath, Heart } from "lucide-react";
import type { AgentListingItem } from "@/types/providers";

type ListingsTabProps = Readonly<{
  listings: AgentListingItem[];
  total: number;
}>;

function formatPrice(price: number | null): string {
  if (price == null) return "POA";
  return `£${price.toLocaleString("en-GB")}`;
}

function statusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "for_rent":
      return {
        label: "For Rent",
        className: "bg-emerald-500 text-white",
      };
    case "under_offer":
      return {
        label: "Under Offer",
        className: "bg-amber-500 text-white",
      };
    case "for_sale":
    default:
      return {
        label: "For Sale",
        className: "bg-[#1B4D3E] text-white",
      };
  }
}

function PropertyCard({ listing }: Readonly<{ listing: AgentListingItem }>) {
  const badge = statusBadge(listing.status);
  const address = [listing.address_line1, listing.city, listing.postcode]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="group bg-[#faf9f8] dark:bg-[#0f1a17] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-[#f4f3f2] dark:bg-[#1a2822]">
        {listing.cover_image_url ? (
          <Image
            src={listing.cover_image_url}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#9ca3af] text-xs">
            No image
          </div>
        )}
        {/* Status badge */}
        <span
          className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}
        >
          {badge.label}
        </span>
        {/* Favourite icon */}
        <button
          type="button"
          aria-label="Save listing"
          className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full text-[#6b7280] hover:text-rose-500 transition-colors"
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-[#1a1a1a] dark:text-white">
          {formatPrice(listing.price)}
        </h3>
        <p className="text-xs uppercase tracking-wide text-[#6b7280] mt-0.5">
          {listing.property_type ?? listing.status}
        </p>
        <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-1 line-clamp-1">
          {address || listing.title}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-4 pt-4 text-sm text-[#6b7280] dark:text-[#9ca3af]">
          {listing.bedrooms != null && (
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              {listing.bedrooms}
            </span>
          )}
          {listing.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              {listing.bathrooms}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ListingsTab({ listings, total }: ListingsTabProps) {
  if (listings.length === 0) {
    return (
      <p className="text-[#6b7280] dark:text-[#9ca3af] text-sm py-8 text-center">
        No active listings
      </p>
    );
  }

  return (
    <div>
      {total > listings.length && (
        <p className="text-sm text-[#6b7280] mb-4">
          Showing {listings.length} of {total} active listings
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {listings.map((listing) => (
          <PropertyCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
