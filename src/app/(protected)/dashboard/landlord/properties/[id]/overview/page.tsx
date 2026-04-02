import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPropertyDetail } from "@/services/landlord/portfolio-service";
import PropertyOverview from "@/components/landlord/PropertyOverview";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Property Overview | Britestate",
};


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const property = await getPropertyDetail(supabase, id).catch(() => null);
  if (!property) notFound();

  return <PropertyOverview property={property} />;
}

export default function PropertyOverviewPage(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent {...props} />
    </Suspense>
  );
}
