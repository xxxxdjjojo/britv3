import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SaleProgressionStepper } from "@/components/seller/sale-progress/SaleProgressionStepper";
import { SaleDocumentsList } from "@/components/seller/sale-progress/SaleDocumentsList";
import { SaleContactsSidebar } from "@/components/seller/sale-progress/SaleContactsSidebar";
import { getSaleProgressionById } from "@/services/seller/sale-progression-service";

export const dynamic = "force-dynamic";

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;

type ListingShape = {
  address_line_1: string | null;
  city: string | null;
} | null;

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-48 mt-2" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Skeleton className="xl:col-span-2 h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}

async function PageContent({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const progression = await getSaleProgressionById(supabase, id);
  if (!progression) redirect("/dashboard/seller/offers");

  const { data: offer } = await supabase
    .from("seller_offers")
    .select(`
      id, buyer_name, amount,
      listing:listing_id ( address_line_1, city )
    `)
    .eq("id", progression.offer_id)
    .maybeSingle();

  const listing = (offer?.listing as unknown as ListingShape) ?? null;
  const address = offer
    ? [listing?.address_line_1, listing?.city].filter(Boolean).join(", ")
    : "Property";

  const completedStages = Object.keys(progression.stage_dates).length;
  const totalStages = 8;
  const progressPct = Math.round((completedStages / totalStages) * 100);
  const isComplete = progression.current_stage === 8;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/seller/offers"
            className="inline-flex items-center gap-1.5 text-sm text-[--color-on-surface]/50 hover:text-[--color-on-surface] transition-colors mb-2"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
            Offers
          </Link>
          <h1 className="text-2xl font-bold text-[--color-on-surface] tracking-tight">
            Sale Progression
          </h1>
          <p className="text-sm text-[--color-on-surface]/60 mt-0.5">
            {address}
            {offer && (
              <span className="text-[--color-on-surface]/40"> · Buyer: {offer.buyer_name}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Completion badge */}
          {isComplete && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 size={13} />
              Sale complete
            </span>
          )}
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[--color-surface] hover:bg-[--color-surface-container-low] text-sm font-semibold text-[--color-on-surface] transition-colors"
          >
            <Share2 size={15} strokeWidth={1.25} />
            Share
          </button>
        </div>
      </div>

      {/* Progress overview pill */}
      <div className="bg-[--color-surface] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[--color-on-surface]">
            Overall progress
          </span>
          <span className="text-sm font-bold text-[--color-brand-primary]">
            {completedStages}/{totalStages} stages
          </span>
        </div>
        <div className="h-2 rounded-full bg-[--color-brand-primary]/10">
          <div
            className="h-full rounded-full bg-[--color-brand-primary] transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-[--color-on-surface]/40 mt-2">{progressPct}% complete</p>
      </div>

      <SaleProgressionStepper progression={progression} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SaleDocumentsList progression={progression} />
        </div>
        <div>
          <SaleContactsSidebar progression={progression} />
        </div>
      </div>
    </div>
  );
}

export default function SaleProgressionPage({ params }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
