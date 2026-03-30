import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMaintenanceRequestById } from "@/services/landlord/maintenance-service";
import { MaintenanceRequestDetailClient } from "./MaintenanceRequestDetailClient";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;


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

  let request;
  try {
    request = await getMaintenanceRequestById(supabase, id);
  } catch {
    notFound();
  }

  // Fetch assigned provider details if present
  let assignedProvider: {
    id: string;
    business_name: string;
    category: string | null;
    average_rating: number | null;
    city: string | null;
  } | null = null;

  if (request.assigned_provider_id) {
    const { data: providerData } = await supabase
      .from("service_provider_profiles")
      .select("id, business_name, category, average_rating, city")
      .eq("id", request.assigned_provider_id)
      .maybeSingle();

    assignedProvider = providerData ?? null;
  }

  // Generate signed URLs for photos
  const signedPhotoUrls: string[] = [];
  for (const photoUrl of request.photo_urls) {
    // Extract storage path from public URL
    const match = photoUrl.match(/maintenance-photos\/(.+)$/);
    if (match) {
      const { data } = await supabase.storage
        .from("maintenance-photos")
        .createSignedUrl(match[1], 3600);
      if (data?.signedUrl) {
        signedPhotoUrls.push(data.signedUrl);
      }
    } else {
      // Fall back to original URL if path extraction fails
      signedPhotoUrls.push(photoUrl);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/landlord/maintenance"
          className="hover:text-brand-primary transition-colors"
        >
          Maintenance
        </Link>
        <span>/</span>
        <span className="max-w-xs truncate font-medium text-foreground">
          {request.title}
        </span>
      </nav>

      <MaintenanceRequestDetailClient
        request={request}
        signedPhotoUrls={signedPhotoUrls}
        assignedProvider={assignedProvider}
      />
    </div>
  );
}

export default function MaintenanceRequestPage({
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
