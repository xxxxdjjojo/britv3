import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSavedProperties } from "@/services/saved/saved-properties-service";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Search,
  Bed,
  MapPin,
  Grid2X2,
  List,
} from "lucide-react";
import { SavedPropertyRemoveButton } from "@/components/listings/SavedPropertyRemoveButton";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(price);
}

export const metadata = {
  title: "Saved Properties — Britestate",
  description: "Your saved properties shortlist",
};

export default async function SavedPropertiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const savedProperties = await getSavedProperties(supabase, user.id);

  const count = savedProperties.length;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ── Empty state ──────────────────────────────────────────────── */}
      {count === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 rounded-3xl bg-white py-20 text-center shadow-sm">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#f4f3f2]">
            <Heart className="size-8 text-emerald-900" strokeWidth={1.25} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-heading text-xl font-bold text-neutral-900">
              No saved properties yet
            </h3>
            <p className="max-w-sm text-sm text-neutral-500">
              Save properties while browsing and they&apos;ll appear here for
              easy comparison.
            </p>
          </div>
          <Link href="/search">
            <Button className="mt-2 gap-2 rounded-xl bg-brand-primary-dark text-white hover:opacity-90">
              <Search className="size-4" strokeWidth={1.25} />
              Search Properties
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* ── Filter/sort bar ───────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* For Sale / To Rent toggle */}
            <div className="flex items-center gap-1 rounded-lg bg-[#f4f3f2] p-1">
              <button
                type="button"
                className="rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm transition-all"
              >
                For Sale
              </button>
              <button
                type="button"
                className="rounded-md px-4 py-1.5 text-xs font-semibold text-neutral-500 transition-all hover:bg-neutral-100"
              >
                To Rent
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* Grid / List view toggle */}
              <div className="flex items-center gap-1 rounded-lg bg-[#f4f3f2] p-1">
                <button
                  type="button"
                  className="rounded-md bg-white p-1.5 text-emerald-900 shadow-sm"
                  aria-label="Grid view"
                >
                  <Grid2X2 className="size-5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-neutral-400 transition-all hover:bg-neutral-100"
                  aria-label="List view"
                >
                  <List className="size-5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">
                  Sort by:{" "}
                  <span className="font-bold text-emerald-900">Date Saved</span>
                </span>
              </div>

              <p className="text-xs text-neutral-400">
                {count} result{count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* ── Property grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {savedProperties.map((saved) => {
              const { listing, property } = saved;
              const href = `/property/${listing.slug ?? listing.id}`;

              return (
                <div
                  key={saved.id}
                  className="group relative flex flex-col overflow-hidden rounded-xl bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                    <Link
                      href={href}
                      className="block size-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                      aria-label={`View ${property.title}`}
                    >
                      <div className="flex size-full items-center justify-center">
                        <Heart
                          className="size-12 text-neutral-200"
                          strokeWidth={1}
                        />
                      </div>
                    </Link>

                    {/* Overlay dimmer on hover */}
                    <div className="pointer-events-none absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />

                    {/* Listing type badge */}
                    {listing.listing_type && (
                      <div className="absolute left-4 top-4">
                        <span className="rounded bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-900 backdrop-blur">
                          {listing.listing_type === "rent"
                            ? "To Rent"
                            : "For Sale"}
                        </span>
                      </div>
                    )}

                    {/* Remove button — visible on hover */}
                    <div className="absolute right-4 top-4 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <SavedPropertyRemoveButton listingId={listing.id} />
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <Link href={href} className="group/link min-w-0">
                        <h3 className="truncate font-heading text-lg font-bold tracking-tight text-neutral-900 transition-colors group-hover/link:text-brand-primary">
                          {property.title}
                        </h3>
                      </Link>
                      <p className="shrink-0 font-heading font-bold text-emerald-900">
                        {formatPrice(listing.price)}
                        {listing.listing_type === "rent" &&
                          listing.rent_frequency && (
                            <span className="ml-1 text-sm font-normal text-neutral-500">
                              /{listing.rent_frequency}
                            </span>
                          )}
                      </p>
                    </div>

                    <p className="mb-6 flex items-center gap-1 text-sm text-neutral-500">
                      <MapPin className="size-3.5 shrink-0" strokeWidth={1.25} />
                      <span className="truncate">
                        {property.address_line1}, {property.city}
                      </span>
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-6">
                      <div className="flex gap-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                            Beds
                          </span>
                          <span className="text-sm font-semibold text-neutral-900">
                            {property.bedrooms}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                            Type
                          </span>
                          <span className="text-sm font-semibold capitalize text-neutral-900">
                            {property.property_type.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>

                      {/* Compare checkbox */}
                      <label className="flex cursor-pointer items-center gap-2 group/check">
                        <span className="text-xs font-semibold text-neutral-400 transition-colors group-hover/check:text-emerald-900">
                          Compare
                        </span>
                        <input
                          type="checkbox"
                          className="size-5 cursor-pointer rounded border-neutral-300 text-emerald-900 focus:ring-emerald-900"
                          aria-label={`Compare ${property.title}`}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
