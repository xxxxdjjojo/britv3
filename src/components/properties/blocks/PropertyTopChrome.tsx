import Link from "next/link";
import { buildPropertyJsonLd } from "@/lib/seo/property-jsonld";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import type { PropertyView } from "@/lib/properties/build-property-view";

/**
 * Shared top chrome for both property templates: structured-data scripts, the
 * inactive-status banner, and breadcrumbs. Visual-only; no per-user state.
 */
export function PropertyTopChrome({ view }: { view: PropertyView }) {
  const { detail, address, isInactiveStatus } = view;
  const { listing, property } = detail;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildPropertyJsonLd(detail)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: "Home", path: "/" },
              {
                name: property.city,
                path: `/properties?location=${encodeURIComponent(property.city)}`,
              },
              {
                name: address,
                path: `/properties/${listing.slug ?? listing.id}`,
              },
            ]),
          ),
        }}
      />

      {isInactiveStatus && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            This property is marked as{" "}
            <strong>{listing.status.replace(/_/g, " ")}</strong> and is no longer
            available for viewings.
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 pt-4 pb-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/properties?location=${encodeURIComponent(property.city)}`}
            className="hover:text-foreground transition-colors"
          >
            {property.city}
          </Link>
          <span aria-hidden="true">/</span>
          <span
            aria-current="page"
            className="text-foreground truncate max-w-[200px]"
          >
            {address}
          </span>
        </nav>
      </div>
    </>
  );
}
