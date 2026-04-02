import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";
import { getMyListings } from "@/services/listings/listing-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Eye,
  Heart,
  BarChart3,
  Pencil,
  ClipboardList,
} from "lucide-react";

const ALLOWED_ROLES: UserRole[] = ["agent", "seller"];

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "under_offer", label: "Under Offer" },
  { value: "sold", label: "Sold / Let" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  active: "bg-green-100 text-green-700",
  under_offer: "bg-amber-100 text-amber-700",
  sold: "bg-blue-100 text-blue-700",
  let: "bg-blue-100 text-blue-700",
  withdrawn: "bg-red-100 text-red-700",
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

export const metadata = {
  title: "My Listings - Britestate",
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
  let listings: Awaited<ReturnType<typeof getMyListings>>["data"] = [];
  let count = 0;
  try {
    const result = await getMyListings(supabase, user.id, {
      status: statusFilter === "sold" ? undefined : statusFilter,
    });
    listings = result.data;
    count = result.count;
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    // Fall through with empty listings
  }

  // Filter for sold tab client-side (includes sold + let)
  const filteredListings =
    statusFilter === "sold"
      ? listings.filter(
          (l) =>
            l.listing.status === "sold" || l.listing.status === "let",
        )
      : listings;

  const activeTab = searchParams.status ?? "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Listings</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {count} {count === 1 ? "listing" : "listings"} total
          </p>
        </div>
        <Link href={`/dashboard/${role}/listings/new`}>
          <Button className="gap-2">
            <Plus className="size-4" />
            Create New Listing
          </Button>
        </Link>
      </div>

      {/* Status Tabs */}
      <Tabs defaultValue={activeTab}>
        <TabsList>
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

        <TabsContent value={activeTab} className="mt-4">
          {filteredListings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-neutral-100">
                  <ClipboardList className="size-8 text-neutral-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-neutral-900">
                  No listings yet
                </h3>
                <p className="mt-2 max-w-md text-sm text-neutral-500">
                  You haven&apos;t created any listings yet. Create your first
                  listing to get started.
                </p>
                <Link href={`/dashboard/${role}/listings/new`} className="mt-4">
                  <Button variant="outline" className="gap-2">
                    <Plus className="size-4" />
                    Create Listing
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredListings.map(({ listing, property, media }) => {
                const thumbnail = media?.[0]?.thumbnail_url ?? null;

                return (
                  <Card key={listing.id}>
                    <CardContent className="flex gap-4 p-4">
                      {/* Thumbnail */}
                      <div className="size-20 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                        {thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbnail}
                            alt={property.title}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-neutral-300">
                            <ClipboardList className="size-8" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-medium text-neutral-900">
                              {property.title}
                            </h3>
                            <p className="truncate text-sm text-neutral-500">
                              {property.address_line1}, {property.city}{" "}
                              {property.postcode}
                            </p>
                          </div>
                          <Badge
                            className={
                              STATUS_COLORS[listing.status] ??
                              "bg-neutral-100 text-neutral-600"
                            }
                          >
                            {listing.status.replace("_", " ")}
                          </Badge>
                        </div>

                        <div className="mt-2 flex items-center gap-4">
                          <span className="text-lg font-bold text-neutral-900">
                            {formatPrice(listing.price)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-neutral-400">
                            <Eye className="size-3" />
                            {listing.view_count}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-neutral-400">
                            <Heart className="size-3" />
                            {listing.favorite_count}
                          </span>
                          <span className="text-xs text-neutral-400">
                            Listed {formatDate(listing.listed_date)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex gap-2">
                          <Link
                            href={`/dashboard/${role}/listings/${listing.id}`}
                          >
                            <Button variant="outline" size="sm" className="gap-1">
                              <Pencil className="size-3" />
                              Edit
                            </Button>
                          </Link>
                          <Link
                            href={`/dashboard/${role}/listings/${listing.id}/analytics`}
                          >
                            <Button variant="outline" size="sm" className="gap-1">
                              <BarChart3 className="size-3" />
                              Analytics
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
