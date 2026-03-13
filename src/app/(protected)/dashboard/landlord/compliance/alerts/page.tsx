import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getComplianceSummary } from "@/services/landlord/document-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, Upload, ArrowLeft } from "lucide-react";
import type { ComplianceDocument } from "@/types/landlord";

// -- Helpers -----------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  gas_safety: "Gas Safety (CP12)",
  electrical_eicr: "Electrical EICR",
  epc: "Energy Performance Certificate",
  deposit_protection: "Deposit Protection",
};

const VALID_CATEGORIES = [
  "gas_safety",
  "electrical_eicr",
  "epc",
  "deposit_protection",
];

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// -- Page props --------------------------------------------------------------

type AlertsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

// -- Main page ---------------------------------------------------------------

export default async function ComplianceAlertsPage({
  searchParams,
}: AlertsPageProps) {
  const params = await searchParams;
  const categoryFilter =
    params.category && VALID_CATEGORIES.includes(params.category)
      ? params.category
      : null;

  const supabase = await createClient();
  const allDocs = await getComplianceSummary(supabase).catch(
    () => [] as ComplianceDocument[],
  );

  // Filter to expired + expiring_soon only, then optionally by category
  let alertDocs = allDocs.filter(
    (d) => d.status === "expired" || d.status === "expiring_soon",
  );

  if (categoryFilter) {
    alertDocs = alertDocs.filter((d) => d.category === categoryFilter);
  }

  // Sort: expired first, then expiring soonest
  alertDocs.sort((a, b) => {
    if (a.status === "expired" && b.status !== "expired") return -1;
    if (a.status !== "expired" && b.status === "expired") return 1;
    return (
      new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
    );
  });

  const expiredCount = alertDocs.filter((d) => d.status === "expired").length;
  const expiringSoonCount = alertDocs.filter(
    (d) => d.status === "expiring_soon",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/dashboard/landlord/compliance"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Compliance
            </Link>
            <span>/</span>
            <span>Expiry Alerts</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Expiry Alerts
          </h1>
          <p className="text-muted-foreground">
            {alertDocs.length === 0
              ? "All certificates are up to date"
              : `${alertDocs.length} alert${alertDocs.length > 1 ? "s" : ""} — ${expiredCount} expired, ${expiringSoonCount} expiring within 30 days`}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/landlord/compliance/upload">
            <Upload className="mr-2 size-4" />
            Upload Certificate
          </Link>
        </Button>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/landlord/compliance/alerts">
          <Badge
            variant={!categoryFilter ? "default" : "secondary"}
            className="cursor-pointer px-3 py-1 text-sm"
          >
            All
          </Badge>
        </Link>
        {VALID_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/dashboard/landlord/compliance/alerts?category=${cat}`}
          >
            <Badge
              variant={categoryFilter === cat ? "default" : "secondary"}
              className="cursor-pointer px-3 py-1 text-sm"
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {alertDocs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <CheckCircle2 className="size-14 text-success" />
            <div>
              <p className="text-lg font-semibold">All certificates are up to date</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {categoryFilter
                  ? `No expired or expiring ${CATEGORY_LABELS[categoryFilter] ?? categoryFilter} certificates.`
                  : "No compliance documents need attention right now."}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/landlord/compliance">
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Alert list */}
      {alertDocs.length > 0 && (
        <div className="space-y-3">
          {alertDocs.map((doc) => {
            const days = getDaysUntil(doc.expiry_date);
            const isExpired = doc.status === "expired";
            const address = [
              doc.property.address_line_1,
              doc.property.city,
              doc.property.postcode,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <Card
                key={doc.id}
                className={`border-l-4 ${isExpired ? "border-l-error" : "border-l-warning"}`}
              >
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    {isExpired ? (
                      <XCircle className="mt-0.5 size-5 shrink-0 text-error" />
                    ) : (
                      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
                    )}
                    <div>
                      <p className="font-medium">{address || "Unknown address"}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[doc.category] ?? doc.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Expiry: {formatDate(doc.expiry_date)}
                        </span>
                        {isExpired ? (
                          <Badge className="border-0 bg-error-light text-xs text-error">
                            {Math.abs(days)} day{Math.abs(days) !== 1 ? "s" : ""} overdue
                          </Badge>
                        ) : (
                          <Badge className="border-0 bg-warning-light text-xs text-warning">
                            {days} day{days !== 1 ? "s" : ""} remaining
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button size="sm" variant={isExpired ? "default" : "outline"} asChild>
                    <Link
                      href={`/dashboard/landlord/compliance/upload?category=${doc.category}`}
                    >
                      <Upload className="mr-2 size-4" />
                      Upload New
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
