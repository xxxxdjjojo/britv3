import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Step1AddressType } from "@/components/seller/wizard/Step1AddressType";
import { Step2Details } from "@/components/seller/wizard/Step2Details";
import { Step3Photos } from "@/components/seller/wizard/Step3Photos";
import { Step4Description } from "@/components/seller/wizard/Step4Description";
import { Step5Price } from "@/components/seller/wizard/Step5Price";
import { Step6Epc } from "@/components/seller/wizard/Step6Epc";
import { Step7Review } from "@/components/seller/wizard/Step7Review";
import type { ReactElement } from "react";
import type { ListingStep } from "@/types/seller";

type Props = Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}>;

function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent({ params, searchParams }: Props) {
  try {
    const { id } = await params;
    const { step: stepStr } = await searchParams;

    const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("seller_listings")
    .select("*")
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (!listing) redirect("/dashboard/seller/listings");

  const step = Math.min(Math.max(parseInt(stepStr ?? "1", 10), 1), 7) as ListingStep;

  const stepComponents: Record<ListingStep, ReactElement> = {
    1: <Step1AddressType listing={listing} />,
    2: <Step2Details listing={listing} listingId={id} />,
    3: <Step3Photos listing={listing} listingId={id} />,
    4: <Step4Description listing={listing} listingId={id} />,
    5: <Step5Price listing={listing} listingId={id} />,
    6: <Step6Epc listing={listing} listingId={id} />,
    7: <Step7Review listing={listing} listingId={id} />,
  };

    return stepComponents[step];
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-on-surface">Edit Listing</h1>
        <p className="mt-4 text-sm text-[--color-on-surface-variant]">Unable to load listing data. Please try refreshing the page.</p>
      </div>
    );
  }
}

export default function EditListingPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
