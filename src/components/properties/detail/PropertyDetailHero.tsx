import Link from "next/link";
import type { Listing, Property, ListingStatus } from "@/types/property";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

type BadgeStyle = {
  label: string;
  className: string;
};

function getStatusBadge(status: ListingStatus): BadgeStyle {
  switch (status) {
    case "active":
      return {
        label: "For Sale",
        className:
          "bg-green-100 text-green-800 border border-green-200",
      };
    case "under_offer":
      return {
        label: "Under Offer",
        className:
          "bg-amber-100 text-amber-800 border border-amber-200",
      };
    case "sold_stc":
      return {
        label: "Sold STC",
        className:
          "bg-red-100 text-red-800 border border-red-200",
      };
    case "sold":
      return {
        label: "Sold",
        className:
          "bg-neutral-100 text-neutral-600 border border-neutral-200",
      };
    case "let":
      return {
        label: "Let",
        className:
          "bg-blue-100 text-blue-800 border border-blue-200",
      };
    case "archived":
    case "withdrawn":
    default:
      return {
        label: status.charAt(0).toUpperCase() + status.slice(1),
        className:
          "bg-neutral-100 text-neutral-500 border border-neutral-200",
      };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPostcodeDistrict(postcode: string): string {
  // "SW1A 2AA" → "SW1A"
  return postcode.trim().split(" ")[0] ?? postcode;
}

function buildTitle(property: Property, listing: Listing): string {
  const bedsLabel = `${property.bedrooms}-bedroom`;
  const typeLabel = property.property_type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const qualifier =
    listing.listing_type === "rent" ? "to Rent" : "for Sale";
  return `${bedsLabel} ${typeLabel} ${qualifier} in ${property.city}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type PropertyDetailHeroProps = Readonly<{
  listing: Listing;
  property: Property;
}>;

export function PropertyDetailHero({
  listing,
  property,
}: PropertyDetailHeroProps) {
  const badge = getStatusBadge(listing.status);
  const district = getPostcodeDistrict(property.postcode);
  const title = buildTitle(property, listing);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    {
      label: property.city,
      href: `/properties?location=${encodeURIComponent(property.city)}`,
    },
    {
      label: district,
      href: `/properties?location=${encodeURIComponent(district)}`,
    },
    {
      label: property.address_line1,
      href: null,
    },
  ];

  return (
    <div className="space-y-2">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap"
      >
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Status badge + title row */}
      <div className="flex flex-wrap items-center gap-3 mt-1">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
        {property.new_build && (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#1B4D3E]/10 text-[#1B4D3E] border border-[#1B4D3E]/20">
            New Build
          </span>
        )}
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
        {title}
      </h1>

      <p className="text-sm text-muted-foreground">
        {[property.address_line1, property.address_line2, property.city, property.postcode]
          .filter(Boolean)
          .join(", ")}
      </p>
    </div>
  );
}
