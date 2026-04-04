import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MaintenanceForm } from "@/components/landlord/MaintenanceForm";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";


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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id: propertyId } = await props.params;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/landlord/properties/${propertyId}/maintenance`}
          className="text-sm text-[--color-on-surface-variant] hover:text-on-surface dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold text-on-surface dark:text-neutral-100">
          New Maintenance Request
        </h1>
      </div>

      <MaintenanceForm propertyId={propertyId} />
    </div>
  );
}

export default function NewMaintenancePage(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent {...props} />
    </Suspense>
  );
}
