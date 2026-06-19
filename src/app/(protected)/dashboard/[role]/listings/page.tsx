import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";
import { getMyListings } from "@/services/listings/listing-service";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Eye,
  Heart,
  MessageSquare,
  BarChart3,
  Pencil,
  ClipboardList,
  MapPin,
} from "lucide-react";

const ALLOWED_ROLES: UserRole[] = ["agent", "seller"];

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "under_offer", label: "Under Offer" },
  { value: "sold", label: "Sold / Let" },
] as const;

const STATUS_PILLS: Record<string, string> = {
  draft: "bg-warning/10 text-warning",
  active: "bg-success/10 text-success",
  under_offer: "bg-brand-primary/10 text-brand-primary",
  sold: "bg-brand-primary/10 text-brand-primary",
  let: "bg-brand-primary/10 text-brand-primary",
  withdrawn: "bg-destructive/10 text-destructive",
  archived: "bg-neutral-100 text-neutral-500",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatStatus(status: string): string {
  return status
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const metadata = {
  title: "My Listings - TrueDeed",
  description: "Manage your property listings",
};

export default async function MyListingsPage(
  props: Readonly<{
    params: Promise<{ role: string }>;
    searchParams: Promise<{ status?: string }>;
  }>,
) {
  const { role } = await props.params;
  const searchParams = await props.searchParams;

  if (!ALLOWED_ROLES.includes(role as UserRole)) {
    redirect(`/dashboard/${role}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const statusFilter =
    searchParams.status && searchParams.status !== "all"
      ? searchParams.status
      : undefined;

  // For "sold" tab, include both sold and let statuses
  const { data: listings, count } = await getMyListings(supabase, user.id, {
    status: statusFilter === "sold" ? undefined : statusFilter,
  });

  // Filter for sold tab client-side (includes sold + let)
  const filteredListings =
    statusFilter === "sold"
      ? listings.filter(
          (l) => l.listing.status === "sold" || l.listing.status === "let",
        )
      : listings;

  const activeTab = searchParams.status ?? "all";

  return (
    <div className="space-y-8">
      {/* Editorial header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
            My Listings
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Manage and track your premium property portfolio —{" "}
            <span className="font-medium text-neutral-700">
              {count} {count === 1 ? "listing" : "listings"}
            </span>{" "}
            total
          </p>
        </div>
        <Link href={`/dashboard/${role}/listings/new`}>
          <Button className="gap-2 bg-brand-primary text-white hover:bg-brand-primary-dark">
            <Plus className="size-4" />
            Create New Listing
          </Button>
        </Link>
      </header>

      {/* Status Tabs */}
      <Tabs defaultValue={activeTab}>
        <TabsList className="bg-transparent p-0">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              <Link
                href={`/dashboard/${role}/listings${tab.value !== "all" ? `?status=${tab.value}` : ""}`}
              >
                {tab.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-brand-primary/10">
                <ClipboardList className="size-8 text-brand-primary" />
              </div>
              <h3 className="mt-5 font-heading text-xl font-bold text-brand-primary-dark">
                No listings yet
              </h3>
              <p className="mt-2 max-w-md text-sm text-neutral-500">
                You haven&apos;t created any listings yet. Create your first
                listing to start building your portfolio.
              </p>
              <Link href={`/dashboard/${role}/listings/new`} className="mt-6">
                <Button className="gap-2 bg-brand-primary text-white hover:bg-brand-primary-dark">
                  <Plus className="size-4" />
                  Create Listing
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredListings.map(({ listing, property, media }) => {
                const thumbnail = media?.[0]?.thumbnail_url ?? null;
                const pillClass =
                  STATUS_PILLS[listing.status] ??
                  "bg-neutral-100 text-neutral-600";

                return (
                  <article
                    key={listing.id}
                    className="group flex flex-col gap-5 rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-md sm:flex-row"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:aspect-square sm:size-36">
                      {thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbnail}
                          alt={property.title}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-neutral-300">
                          <ClipboardList className="size-10" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-1 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${pillClass}`}
                            >
                              {formatStatus(listing.status)}
                            </span>
                            <span className="text-xs text-neutral-400">
                              Listed {formatDate(listing.listed_date)}
                            </span>
                          </div>
                          <h3 className="truncate font-heading text-lg font-bold text-brand-primary-dark">
                            {property.title}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-neutral-500">
                            <MapPin className="size-3.5 shrink-0" />
                            {property.address_line1}, {property.city}{" "}
                            {property.postcode}
                          </p>
                        </div>
                        <span className="shrink-0 font-heading text-xl font-bold text-brand-primary">
                          {formatPrice(listing.price)}
                        </span>
                      </div>

                      {/* Key stats */}
                      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                        <Stat
                          icon={<Eye className="size-4" />}
                          label="Views"
                          value={listing.view_count}
                        />
                        <Stat
                          icon={<Heart className="size-4" />}
                          label="Saves"
                          value={listing.favorite_count}
                        />
                        <Stat
                          icon={<MessageSquare className="size-4" />}
                          label="Enquiries"
                          value={listing.enquiry_count}
                        />
                      </div>

                      {/* Actions */}
                      <div className="mt-auto flex flex-wrap gap-2 pt-4">
                        <Link href={`/dashboard/${role}/listings/${listing.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-border"
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </Button>
                        </Link>
                        <Link
                          href={`/dashboard/${role}/listings/${listing.id}/analytics`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-border"
                          >
                            <BarChart3 className="size-3.5" />
                            Analytics
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: Readonly<{ icon: React.ReactNode; label: string; value: number }>) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-brand-primary/70">{icon}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-bold text-brand-primary-dark">
          {value}
        </span>
        <span className="text-xs uppercase tracking-wide text-neutral-400">
          {label}
        </span>
      </div>
    </div>
  );
}
