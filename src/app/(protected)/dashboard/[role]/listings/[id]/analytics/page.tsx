import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";
import {
  getListing,
  getListingAnalytics,
  getPriceHistory,
} from "@/services/listings/listing-service";
import { ListingAnalytics } from "@/components/listings/ListingAnalytics";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ALLOWED_ROLES: UserRole[] = ["agent", "seller"];

export const metadata = {
  title: "Listing Analytics - TrueDeed",
  description: "View analytics for your property listing",
};

export default async function ListingAnalyticsPage(
  props: Readonly<{ params: Promise<{ role: string; id: string }> }>,
) {
  const { role, id } = await props.params;

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

  const listing = await getListing(supabase, id);

  if (!listing) {
    notFound();
  }

  // Verify ownership
  if (listing.listing.user_id !== user.id) {
    redirect(`/dashboard/${role}/listings`);
  }

  const [analytics, priceHistory] = await Promise.all([
    getListingAnalytics(supabase, id),
    getPriceHistory(supabase, id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/${role}/listings`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Listing Analytics
          </h1>
          <p className="text-sm text-neutral-500">
            {listing.property.title} - {listing.property.address_line1}
          </p>
        </div>
      </div>

      <ListingAnalytics
        viewCount={analytics.view_count}
        favoriteCount={analytics.favorite_count}
        enquiryCount={analytics.enquiry_count}
        listedDate={listing.listing.listed_date}
        priceHistory={priceHistory}
      />
    </div>
  );
}
