import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentListings } from "@/services/agent/agent-listings-service";
import { FeaturedListingBoost } from "@/components/dashboard/agent/billing/FeaturedListingBoost";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Listing = {
  id: string;
  title: string | null;
  address_line_1: string | null;
  city: string | null;
  postcode: string | null;
  price: number | null;
  status: string;
  featured_until: string | null;
};

type Props = {
  searchParams: Promise<{ success?: string; listing_id?: string }>;
};


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent({ searchParams }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const params = await searchParams;
  const isSuccess = params.success === "1";

  let activeListings: Listing[] = [];
  let boostedListings: Listing[] = [];

  try {
    // Fetch all active listings
    const { listings } = await getAgentListings(supabase, user.id, "active");
    activeListings = (listings as Listing[]).filter(
      (l) => !l.featured_until || new Date(l.featured_until) <= new Date(),
    );

    // Fetch currently boosted listings (featured_until > now)
    const { listings: allListings } = await getAgentListings(supabase, user.id);
    const now = new Date().toISOString();
    boostedListings = (allListings as Listing[]).filter(
      (l) => l.featured_until != null && l.featured_until > now,
    );
  } catch {
    // Fall through with empty arrays
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/agent/billing">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Featured Listing Boost</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Promote your listings to the top of search results with a Featured badge.
          </p>
        </div>
      </div>

      {isSuccess ? (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-6 text-center space-y-3">
          <CheckCircle className="size-10 text-green-500 mx-auto" />
          <h2 className="font-semibold text-lg">Boost Purchased!</h2>
          <p className="text-muted-foreground text-sm">
            Your listing will appear as Featured in search results shortly.
            It may take a few minutes for the boost to activate.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/agent/listings">View My Listings</Link>
          </Button>
        </div>
      ) : (
        <FeaturedListingBoost
          activeListings={activeListings}
          boostedListings={boostedListings}
        />
      )}
    </div>
  );
}

export default function FeaturedBoostPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent searchParams={searchParams} />
    </Suspense>
  );
}
