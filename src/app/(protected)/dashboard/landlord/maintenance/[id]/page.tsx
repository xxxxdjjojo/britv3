import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMaintenanceRequestById } from "@/services/landlord/maintenance-service";
import { MaintenanceRequestDetailClient } from "./MaintenanceRequestDetailClient";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function MaintenanceRequestPage({
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
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link
          href="/dashboard/landlord/maintenance"
          className="hover:text-[#1B4D3E] transition-colors"
        >
          Maintenance
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium truncate max-w-xs">
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
