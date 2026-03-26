import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getDocuments,
  getExpiringDocuments,
} from "@/services/landlord/document-service";
import ComplianceAlert from "@/components/landlord/ComplianceAlert";
import DocumentUpload from "@/components/landlord/DocumentUpload";
import DocumentList from "@/components/landlord/DocumentList";
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
  params: Promise<{ id: string }>;
}) {
  const { id: propertyId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch documents and expiring documents in parallel
  const [documents, expiringDocs, tenanciesResult] = await Promise.all([
    getDocuments(supabase, propertyId),
    getExpiringDocuments(supabase, propertyId),
    supabase
      .from("tenancies")
      .select("id, tenant_name, status")
      .eq("property_id", propertyId)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
  ]);

  const tenancies = (tenanciesResult.data ?? []) as Tenancy[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Upload and manage compliance documents for this property.
        </p>
      </div>

      {/* Compliance alert for expiring documents */}
      <ComplianceAlert
        expiringDocuments={expiringDocs}
        propertyId={propertyId}
      />

      {/* Upload form */}
      <DocumentUpload propertyId={propertyId} tenancies={tenancies} />

      {/* Document list */}
      <DocumentList documents={documents} />
    </div>
  );
}

export default function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
