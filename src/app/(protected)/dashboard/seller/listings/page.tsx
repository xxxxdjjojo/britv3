import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getSellerListings } from "@/services/seller/listing-service";
import { StatusTabs } from "@/components/seller/StatusTabs";
import { ListingCard } from "@/components/seller/ListingCard";
import type { ListingStatus } from "@/types/seller";

export const dynamic = "force-dynamic";

const STATUS_TABS: Array<{ key: ListingStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "under_offer", label: "Under Offer" },
  { key: "sold", label: "Sold" },
  { key: "draft", label: "Drafts" },
];

type Props = Readonly<{
  searchParams: Promise<{ status?: string }>;
}>;

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

async function PageContent({ searchParams }: Props) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const allListings = await getSellerListings(supabase);
  const countByStatus = allListings.reduce(
    (acc, l) => { acc[l.status] = (acc[l.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>,
  );
  const tabs = STATUS_TABS.map((t) => ({
    ...t,
    count: t.key === "all" ? allListings.length : (countByStatus[t.key] ?? 0),
  }));
  const displayed = status ? allListings.filter((l) => l.status === status) : allListings;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">My Listings</h1>
          <p className="text-slate-500 mt-1">Manage all your property listings</p>
        </div>
        <Link
          href="/dashboard/seller/listings/create?step=1"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B4D3E] text-white text-sm font-semibold hover:bg-[#2D7A5F] active:scale-95 transition-all shadow-lg shadow-[#1B4D3E]/20"
        >
          <Plus size={16} />
          Create New Listing
        </Link>
      </div>
      <StatusTabs tabs={tabs} />
      {displayed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-400 mb-4">No listings{status ? ` with status "${status}"` : ""}</p>
          <Link
            href="/dashboard/seller/listings/create?step=1"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B4D3E] text-white text-sm font-semibold"
          >
            <Plus size={14} /> Create your first listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyListingsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent searchParams={searchParams} />
    </Suspense>
  );
}
