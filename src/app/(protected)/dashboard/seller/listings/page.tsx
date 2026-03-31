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
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

async function PageContent({ searchParams }: Props) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const allListings = await getSellerListings(supabase);
  const countByStatus = allListings.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const tabs = STATUS_TABS.map((t) => ({
    ...t,
    count: t.key === "all" ? allListings.length : (countByStatus[t.key] ?? 0),
  }));
  const displayed = status
    ? allListings.filter((l) => l.status === status)
    : allListings;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.2em] text-[--color-brand-secondary-dark] uppercase block mb-2">
            My Portfolio
          </span>
          <h1 className="text-3xl font-extrabold text-[--color-brand-primary-dark] font-['Plus_Jakarta_Sans'] tracking-tight leading-tight">
            My Listings
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Manage and track your property portfolio
          </p>
        </div>
        <Link
          href="/dashboard/seller/listings/create?step=1"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[--color-brand-primary-dark] text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm flex-shrink-0"
        >
          <Plus size={16} strokeWidth={2} />
          List New Property
        </Link>
      </div>

      {/* Status Tabs */}
      <StatusTabs tabs={tabs} />

      {/* Listings */}
      {displayed.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[--color-brand-primary-dark]/5 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-[--color-brand-primary-dark]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75v-5.25h-4.5V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
            </svg>
          </div>
          <p className="text-zinc-500 mb-1 text-sm">
            No listings{status ? ` with status &ldquo;${status}&rdquo;` : ""}
          </p>
          <p className="text-zinc-400 text-xs mb-6">
            Create your first listing to get started
          </p>
          <Link
            href="/dashboard/seller/listings/create?step=1"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[--color-brand-primary-dark] text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Plus size={14} strokeWidth={2} /> Create your first listing
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
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
