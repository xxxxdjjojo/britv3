import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Printer, Mail } from "lucide-react";
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
    <div className="space-y-8">
      <div>
        <Skeleton className="h-4 w-20 mb-3" />
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-sm text-neutral-400 mb-3">
            <Link
              href="/dashboard/seller/offers"
              className="flex items-center gap-1.5 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              Offers
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="text-brand-primary font-medium">{address}</span>
          </nav>
          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-on-surface tracking-tight">
            Sale Progress Tracker
          </h1>
          {offer && (
            <p className="text-neutral-500 mt-1">
              Sale to{" "}
              <span className="font-semibold text-brand-primary">
                {offer.buyer_name}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {isComplete && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-container/20 text-brand-primary text-xs font-semibold">
              <CheckCircle2 size={13} />
              Sale complete
            </span>
          )}
          <button
            type="button"
            className="px-4 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-surface-container transition-colors shadow-sm"
          >
            <Printer size={15} strokeWidth={1.25} />
            Print Report
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-colors shadow-md"
          >
            <Mail size={15} strokeWidth={1.25} />
            Contact Solicitor
          </button>
        </div>
      </div>

      {/* Progress overview pill */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-brand-primary">
            Live Conveyancing Timeline
          </h2>
          <span className="bg-primary-container/20 text-brand-primary px-3 py-1 rounded-full text-xs font-bold border border-outline-variant/20 uppercase tracking-wider">
            Status: {progressPct}% Complete
          </span>
        </div>
        <SaleProgressionStepper progression={progression} />
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: documents */}
        <div className="col-span-12 lg:col-span-8">
          <SaleDocumentsList progression={progression} />
        </div>

        {/* Right: contacts */}
        <div className="col-span-12 lg:col-span-4">
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
