import Image from "next/image";
import Link from "next/link";
import { Home } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { ListingType } from "@/types/property";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = Readonly<{
  propertyId: string;
  postcodeDistrict: string; // e.g. 'TW7'
  listingType: ListingType;
  price: number;
  propertyType: string;
}>;

type SimilarRow = {
  listing_id: string;
  slug: string | null;
  title: string;
  price: number;
  bedrooms: number;
  property_type: string;
  city: string;
  thumbnail_url: string | null;
  address_line1: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(pence: number, listingType: ListingType): string {
  const amount = pence / 100;
  if (listingType === "rent") {
    return `£${amount.toLocaleString("en-GB")} pcm`;
  }
  return `£${amount.toLocaleString("en-GB")}`;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchSimilarListings(
  propertyId: string,
  postcodeDistrict: string,
  listingType: ListingType,
  price: number,
): Promise<SimilarRow[]> {
  const supabase = await createClient();

  const priceMin = price * 0.8;
  const priceMax = price * 1.2;

  // Query the search_listings materialized view — already filtered to
  // status='active' and not deleted. Use postcode LIKE to match district.
  const { data, error } = await supabase
    .from("search_listings")
    .select(
      "listing_id, slug, title, price, bedrooms, property_type, city, thumbnail_url, address_line1",
    )
    .eq("listing_type", listingType)
    .like("postcode", `${postcodeDistrict}%`)
    .gte("price", priceMin)
    .lte("price", priceMax)
    .neq("property_id", propertyId)
    .limit(4);

  if (error || !data) return [];

  return data as SimilarRow[];
}

// ---------------------------------------------------------------------------
// Card sub-component
// ---------------------------------------------------------------------------

function SimilarPropertyCard({
  row,
  listingType,
}: Readonly<{ row: SimilarRow; listingType: ListingType }>) {
  const href = row.slug ? `/properties/${row.slug}` : `/properties/listing/${row.listing_id}`;

  return (
    <Link
      href={href}
      className="group flex gap-3 rounded-lg border bg-card p-3 hover:border-[color:var(--brand-primary,#1B4D3E)] transition-colors"
    >
      {/* Thumbnail */}
      <div className="relative size-16 rounded-md overflow-hidden shrink-0 bg-muted">
        {row.thumbnail_url ? (
          <Image
            src={row.thumbnail_url}
            alt={row.title}
            fill
            loading="lazy"
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="64px"
          />
        ) : (
          <div className="size-full flex items-center justify-center">
            <Home className="size-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-semibold text-foreground truncate">{row.title}</p>
        <p className="text-xs text-muted-foreground truncate">{row.address_line1}, {row.city}</p>
        <p className="text-xs">
          <span className="font-semibold" style={{ color: "var(--brand-primary, #1B4D3E)" }}>
            {formatPrice(row.price, listingType)}
          </span>
          {row.bedrooms > 0 && (
            <span className="text-muted-foreground ml-1">· {row.bedrooms} bed</span>
          )}
        </p>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export async function SimilarProperties({
  propertyId,
  postcodeDistrict,
  listingType,
  price,
  propertyType: _propertyType,
}: Props) {
  const rows = await fetchSimilarListings(propertyId, postcodeDistrict, listingType, price);

  // Require at least 2 results to render the section
  if (rows.length < 2) return null;

  return (
    <section aria-labelledby="similar-properties-heading" className="space-y-3">
      <h2
        id="similar-properties-heading"
        className="text-sm font-semibold text-foreground"
      >
        Similar Properties Nearby
      </h2>

      <div className="space-y-2">
        {rows.map((row) => (
          <SimilarPropertyCard key={row.listing_id} row={row} listingType={listingType} />
        ))}
      </div>
    </section>
  );
}
