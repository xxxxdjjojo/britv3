import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import LeasePreview from "@/components/landlord/LeasePreview";
import type { Tenancy } from "@/types/landlord";
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

async function PageContent({
  params,
}: {
  params: Promise<{ id: string; tenancyId: string }>;
}) {
  const { id: propertyId, tenancyId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch tenancy data
  const { data: tenancy, error: tenancyError } = await supabase
    .from("tenancies")
    .select("*")
    .eq("id", tenancyId)
    .single();

  if (tenancyError || !tenancy) {
    redirect(`/dashboard/landlord/properties/${propertyId}/tenancies`);
  }

  // Fetch property address
  const { data: property } = await supabase
    .from("listings")
    .select("address_line_1, address_line_2, city, postcode")
    .eq("id", propertyId)
    .single();

  const propertyAddress = property
    ? [
        property.address_line_1,
        property.address_line_2,
        property.city,
        property.postcode,
      ]
        .filter(Boolean)
        .join(", ")
    : "Property address";

  // Fetch landlord name from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const landlordName = profile?.full_name ?? user.email ?? "Landlord";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          href="/dashboard/landlord/properties"
          className="hover:text-foreground"
        >
          Portfolio
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/dashboard/landlord/properties/${propertyId}/overview`}
          className="hover:text-foreground"
        >
          Property
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/dashboard/landlord/properties/${propertyId}/tenancies`}
          className="hover:text-foreground"
        >
          Tenancies
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Generate Lease</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Generate Lease Agreement
        </h1>
        <p className="text-sm text-muted-foreground">
          Preview and download an Assured Shorthold Tenancy agreement
          pre-filled with tenancy data.
        </p>
      </div>

      <LeasePreview
        tenancy={tenancy as Tenancy}
        propertyAddress={propertyAddress}
        landlordName={landlordName}
        propertyId={propertyId}
      />
    </div>
  );
}

export default function LeasePage({
  params,
}: {
  params: Promise<{ id: string; tenancyId: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
