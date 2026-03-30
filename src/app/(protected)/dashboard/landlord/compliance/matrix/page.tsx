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
  const matrixData = await getComplianceMatrix(supabase);
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
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Compliance Matrix
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Property × requirement status at a glance — green is valid, amber is
          expiring, red is expired
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <MatrixContent />
      </Suspense>
    </div>
  );
}
