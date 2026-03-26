import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPortfolioProperties } from "@/services/landlord/portfolio-service";
import ComplianceUploadForm from "@/components/landlord/ComplianceUploadForm";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// -- Page props --------------------------------------------------------------

type UploadPageProps = {
  searchParams: Promise<{
    propertyId?: string;
    defaultPropertyId?: string;
    category?: string;
    defaultCategory?: string;
  }>;
};

// -- Page --------------------------------------------------------------------


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent({
  searchParams,
}: UploadPageProps) {
  const params = await searchParams;

  // Support both URL param names (from different navigation contexts)
  const defaultPropertyId = params.propertyId ?? params.defaultPropertyId;
  const defaultCategory = params.category ?? params.defaultCategory;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch landlord's properties for dropdown
  const portfolioProperties = await getPortfolioProperties(supabase).catch(
    () => [],
  );

  // Map to simple address format for the form
  const properties = portfolioProperties.map((p) => ({
    id: p.id,
    address: [p.address_line_1, p.city, p.postcode].filter(Boolean).join(", "),
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/landlord/compliance"
          className="flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Compliance
        </Link>
        <span>/</span>
        <span>Upload Certificate</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Upload Compliance Document
        </h1>
        <p className="mt-1 text-muted-foreground">
          Upload a gas safety certificate, EPC, EICR, or other compliance
          document. Files are stored securely and only accessible to you.
        </p>
      </div>

      {/* Form */}
      {properties.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">No properties in your portfolio</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a property to your portfolio before uploading compliance
            documents.
          </p>
          <Link
            href="/dashboard/landlord/properties/add"
            className="mt-4 inline-block text-sm font-medium text-primary underline"
          >
            Add a property
          </Link>
        </div>
      ) : (
        <ComplianceUploadForm
          properties={properties}
          defaultPropertyId={defaultPropertyId}
          defaultCategory={defaultCategory}
        />
      )}
    </div>
  );
}

export default function ComplianceUploadPage({ searchParams,  }: UploadPageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent searchParams={searchParams} ={} />
    </Suspense>
  );
}
