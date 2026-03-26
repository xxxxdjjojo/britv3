import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMaintenanceRequestById } from "@/services/landlord/maintenance-service";
import { AssignTradesPersonClient } from "./AssignTradesPersonClient";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

/**
 * Maintenance category → marketplace provider category mapping.
 * Maps the maintenance_requests.title/description category to
 * service_provider_profiles.category values used in Epic 4 marketplace.
 */
function mapMaintenanceCategoryToProviderCategory(
  title: string,
): string | null {
  const lower = title.toLowerCase();
  if (lower.includes("plumb") || lower.includes("pipe") || lower.includes("leak") || lower.includes("drain")) {
    return "plumber";
  }
  if (lower.includes("electric") || lower.includes("socket") || lower.includes("light") || lower.includes("fuse")) {
    return "electrician";
  }
  if (lower.includes("boiler") || lower.includes("heat") || lower.includes("gas") || lower.includes("radiator")) {
    return "gas_engineer";
  }
  if (lower.includes("roof") || lower.includes("wall") || lower.includes("brick") || lower.includes("crack")) {
    return "builder";
  }
  return null; // return all categories
}


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch maintenance request
  let request;
  try {
    request = await getMaintenanceRequestById(supabase, id);
  } catch {
    notFound();
  }

  // Fetch property for postcode
  const { data: propertyData } = await supabase
    .from("properties")
    .select("postcode, city")
    .eq("id", request.property_id)
    .maybeSingle();

  const postcode = propertyData?.postcode ?? "";
  const city = propertyData?.city ?? "";

  // Map maintenance category to provider category
  const providerCategory = mapMaintenanceCategoryToProviderCategory(
    request.title,
  );

  // Fetch matching marketplace providers
  let providersQuery = supabase
    .from("service_provider_profiles")
    .select("id, business_name, category, average_rating, city")
    .order("average_rating", { ascending: false })
    .limit(20);

  if (providerCategory) {
    providersQuery = providersQuery.eq("category", providerCategory);
  }

  const { data: providersData } = await providersQuery;
  const providers = (providersData ?? []) as Array<{
    id: string;
    business_name: string;
    category: string | null;
    average_rating: number | null;
    city: string | null;
  }>;

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link
          href="/dashboard/landlord/maintenance"
          className="hover:text-[#1B4D3E] transition-colors"
        >
          Maintenance
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/landlord/maintenance/${id}`}
          className="hover:text-[#1B4D3E] transition-colors truncate max-w-[160px]"
        >
          {request.title}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium">
          Assign Tradesperson
        </span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Assign Tradesperson
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose a verified marketplace provider for:{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {request.title}
          </span>
        </p>
        {(city || postcode) && (
          <p className="mt-0.5 text-xs text-slate-400">
            Property: {city}{postcode ? ` · ${postcode}` : ""}
          </p>
        )}
      </div>

      {/* Provider note if table is empty */}
      {providers.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <p className="font-semibold">No marketplace providers found.</p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            {/* TODO: Marketplace integration pending Phase 4 data */}
            The Epic 4 marketplace provider data is not yet populated. You can
            still manually assign a provider by entering their name below.
          </p>
        </div>
      )}

      {/* Client-side assign component */}
      <AssignTradesPersonClient
        requestId={id}
        requestTitle={request.title}
        requestCategory={request.title}
        propertyPostcode={postcode}
        currentAssignedId={request.assigned_provider_id ?? undefined}
        providers={providers}
      />
    </div>
  );
}

export default function AssignTradesPersonPage({
  params,
}: {
  params: Params;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
