import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getComplianceSummary } from "@/services/landlord/document-service";
import { getPortfolioProperties } from "@/services/landlord/portfolio-service";
import CertificateStatusTile from "@/components/landlord/CertificateStatusTile";
import type { ComplianceCategoryKey } from "@/lib/compliance-constants";
import { CATEGORY_LABELS } from "@/lib/compliance-constants";
import { getDaysUntil } from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  XCircle,
  Upload,
  Bell,
  CheckCircle2,
} from "lucide-react";
import type { ComplianceDocument } from "@/types/landlord";

// -- Helpers -----------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// -- Tile data builder -------------------------------------------------------

type TileCounts = {
  totalProperties: number;
  expired: number;
  expiringSoon: number;
  valid: number;
};

function buildTileCounts(
  docs: ComplianceDocument[],
  category: string,
  totalProperties: number,
): TileCounts {
  const categoryDocs = docs.filter((d) => d.category === category);
  return {
    totalProperties,
    expired: categoryDocs.filter((d) => d.status === "expired").length,
    expiringSoon: categoryDocs.filter((d) => d.status === "expiring_soon").length,
    valid: categoryDocs.filter((d) => d.status === "valid").length,
  };
}

// -- Loading skeleton --------------------------------------------------------

function ComplianceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// -- Main page ---------------------------------------------------------------

export default async function CompliancePage() {
  const supabase = await createClient();

  // Fetch compliance docs and portfolio in parallel
  const [docs, properties] = await Promise.all([
    getComplianceSummary(supabase),
    getPortfolioProperties(supabase),
  ]);

  const totalProperties = properties.length;

  // Build tile counts per category
  const gasSafetyCounts = buildTileCounts(docs, "gas_safety", totalProperties);
  const eicCounts = buildTileCounts(docs, "electrical_eicr", totalProperties);
  const epcCounts = buildTileCounts(docs, "epc", totalProperties);

  // Deposit protection: query deposit_registrations for unregistered count
  // For now derived from docs with category deposit_protection (when added)
  // Default to 0 unregistered until deposit_protection docs are tracked
  const depositCounts: TileCounts = {
    totalProperties,
    expired: 0,
    expiringSoon: 0,
    valid: totalProperties,
  };

  const totalExpired =
    gasSafetyCounts.expired +
    eicCounts.expired +
    epcCounts.expired +
    depositCounts.expired;

  const totalExpiringSoon =
    gasSafetyCounts.expiringSoon +
    eicCounts.expiringSoon +
    epcCounts.expiringSoon +
    depositCounts.expiringSoon;

  // All certificates sorted by expiry (most urgent first)
  const allDocs = [...docs].sort((a, b) => {
    if (a.status === "expired" && b.status !== "expired") return -1;
    if (a.status !== "expired" && b.status === "expired") return 1;
    return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Compliance Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track gas safety, EPC, EICR, and deposit protection across your
            portfolio
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/landlord/compliance/alerts">
              <Bell className="mr-2 size-4" />
              View Alerts
            </Link>
          </Button>
          <Button size="sm" className="bg-brand-primary hover:bg-brand-primary-light text-white" asChild>
            <Link href="/dashboard/landlord/compliance/upload">
              <Upload className="mr-2 size-4" />
              Upload Certificate
            </Link>
          </Button>
        </div>
      </div>

      {/* Critical alert banner */}
      {(totalExpired > 0 || totalExpiringSoon > 0) && (
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 ${
            totalExpired > 0
              ? "border-error/30 bg-error-light text-error"
              : "border-warning/30 bg-warning-light text-warning"
          }`}
        >
          {totalExpired > 0 ? (
            <XCircle className="mt-0.5 size-5 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {totalExpired > 0
                ? `${totalExpired} certificate${totalExpired > 1 ? "s" : ""} expired — action required`
                : `${totalExpiringSoon} certificate${totalExpiringSoon > 1 ? "s" : ""} expiring within 30 days`}
            </p>
            <p className="mt-0.5 text-xs opacity-80">
              Letting a property with expired safety certificates can lead to
              fines or prosecution. Upload updated documents immediately.
            </p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0" asChild>
            <Link href="/dashboard/landlord/compliance/alerts">
              View All Alerts
            </Link>
          </Button>
        </div>
      )}

      {/* 4 category tiles */}
      <Suspense fallback={<ComplianceSkeleton />}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CertificateStatusTile
            category={"gas_safety" as ComplianceCategoryKey}
            {...gasSafetyCounts}
          />
          <CertificateStatusTile
            category={"electrical_eicr" as ComplianceCategoryKey}
            {...eicCounts}
          />
          <CertificateStatusTile
            category={"epc" as ComplianceCategoryKey}
            {...epcCounts}
          />
          <CertificateStatusTile
            category={"deposit_protection" as ComplianceCategoryKey}
            {...depositCounts}
          />
        </div>
      </Suspense>

      {/* Quick-link to compliance matrix */}
      <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Property × Document Matrix
          </p>
          <p className="text-xs text-muted-foreground">
            See compliance status for every property at a glance
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/landlord/compliance/matrix">
            View Matrix
          </Link>
        </Button>
      </div>

      {/* All certificates table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <p className="font-heading text-sm font-semibold text-foreground">
              All Certificates
            </p>
            <p className="text-xs text-muted-foreground">Sorted by urgency</p>
          </div>

          {allDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <CheckCircle2 className="size-10 text-success" />
              <p className="font-medium text-foreground">
                No compliance documents yet
              </p>
              <p className="text-sm text-muted-foreground">
                Upload your first compliance certificate to get started.
              </p>
              <Button
                size="sm"
                className="mt-2 bg-brand-primary hover:bg-brand-primary-light text-white"
                asChild
              >
                <Link href="/dashboard/landlord/compliance/upload">
                  <Upload className="mr-2 size-4" />
                  Upload Certificate
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Property
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Expires
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allDocs.map((doc) => {
                    const days = getDaysUntil(doc.expiry_date);
                    const address = [
                      doc.property.address_line_1,
                      doc.property.city,
                    ]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <TableRow
                        key={doc.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="font-medium text-foreground">
                          {address || "Unknown address"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="text-xs font-medium"
                          >
                            {CATEGORY_LABELS[doc.category] ?? doc.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums text-sm text-muted-foreground">
                          {formatDate(doc.expiry_date)}
                        </TableCell>
                        <TableCell>
                          {doc.status === "expired" && (
                            <Badge className="border-0 bg-error-light text-error text-xs">
                              Expired {Math.abs(days)}d ago
                            </Badge>
                          )}
                          {doc.status === "expiring_soon" && (
                            <Badge className="border-0 bg-warning-light text-warning text-xs">
                              Expires in {days}d
                            </Badge>
                          )}
                          {doc.status === "valid" && (
                            <Badge className="border-0 bg-success-light text-success text-xs">
                              Valid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/dashboard/landlord/compliance/upload?category=${doc.category}`}
                            >
                              Upload New
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
