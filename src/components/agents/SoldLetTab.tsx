/**
 * SoldLetTab — Server Component
 *
 * Renders a 2-column grid of sold/let property cards for an agent's
 * transaction history. Each card shows the sold price vs asking price
 * with a % of asking badge. Matches the agency-public-profile Stitch reference.
 */

import Image from "next/image";
import { Bed, Bath } from "lucide-react";
import type { AgentListingItem } from "@/types/providers";

type SoldLetTabProps = Readonly<{
  listings: AgentListingItem[];
  total: number;
}>;

function formatPrice(price: number | null | undefined): string {
  if (price == null) return "POA";
  return `£${price.toLocaleString("en-GB")}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function calcPctAsking(soldPrice: number | null, askingPrice: number | null): number | null {
  if (soldPrice == null || askingPrice == null || askingPrice === 0) return null;
  return Math.round((soldPrice / askingPrice) * 100);
}

function SoldCard({ listing }: Readonly<{ listing: AgentListingItem }>) {
  const pct = calcPctAsking(listing.sold_price, listing.price);
  const address = [listing.address_line1, listing.city, listing.postcode]
    .filter(Boolean)
    .join(", ");
  const statusLabel = listing.status === "let" ? "Let" : "Sold";
  const statusClass =
    listing.status === "let"
      ? "bg-brand-primary/10 text-brand-primary"
      : "bg-success-light text-success";

  return (
    <article className="group bg-neutral-50 dark:bg-neutral-950 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        {listing.cover_image_url ? (
          <Image
            src={listing.cover_image_url}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-xs">
            No image
          </div>
        )}
        {/* Status badge */}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass}`}>
          {statusLabel}
        </span>
        {/* % of asking badge */}
        {pct != null && (
          <span className="absolute bottom-3 right-3 bg-success-light text-success text-xs font-bold rounded-full px-2 py-0.5">
            {pct}% of asking
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Sold price */}
        <h3 className="text-xl font-bold text-brand-primary dark:text-success">
          {statusLabel} for {formatPrice(listing.sold_price)}
        </h3>
        {/* Asking price (struck through if differs) */}
        {listing.price != null && listing.sold_price !== listing.price && (
          <p className="text-sm text-neutral-500 line-through mt-0.5">
            Asking {formatPrice(listing.price)}
          </p>
        )}

        <p className="text-xs uppercase tracking-wide text-neutral-500 mt-1">
          {listing.property_type ?? "Property"}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
          {address || listing.title}
        </p>
        {listing.sold_at && (
          <p className="text-xs text-neutral-400 mt-1">
            {statusLabel} {formatDate(listing.sold_at)}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-4 pt-4 text-sm text-neutral-500 dark:text-neutral-400">
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

export default function SoldLetTab({ listings, total }: SoldLetTabProps) {
  if (listings.length === 0) {
    return (
      <p className="text-neutral-500 dark:text-neutral-400 text-sm py-8 text-center">
        No sold or let properties
      </p>
    );
  }

  return (
    <div>
      {total > listings.length && (
        <p className="text-sm text-neutral-500 mb-4">
          Showing {listings.length} of {total} transactions
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {listings.map((listing) => (
          <SoldCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
