import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getComplianceMatrix } from "@/services/landlord/compliance-matrix-service";
import { ComplianceMatrix } from "@/components/landlord/ComplianceMatrix";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Compliance Matrix | Landlord | Britestate",
};

async function MatrixContent() {
  const supabase = await createClient();
  let matrixData;
  try {
    matrixData = await getComplianceMatrix(supabase);
  } catch {
    matrixData = { properties: [], categories: [] };
  }
  return <ComplianceMatrix data={matrixData} />;
}

export default function ComplianceMatrixPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/landlord/compliance"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Compliance
        </Link>
      </div>

      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Compliance Matrix
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage certificates across your portfolio
          </p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
        >
          Export Report
        </button>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <MatrixContent />
      </Suspense>
    </div>
  );
}
