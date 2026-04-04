import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Home, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listMyApplications, listApplications } from "@/services/landlord/tenant-application-service";
import type { TenantApplication, TenantApplicationStatus } from "@/types/landlord";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusLabel(status: TenantApplicationStatus): string {
  switch (status) {
    case "received": return "Under Review";
    case "shortlisted": return "Shortlisted";
    case "referencing": return "Referencing";
    case "approved": return "Accepted";
    case "rejected": return "Rejected";
    case "withdrawn": return "Withdrawn";
    default: return status;
  }
}

function statusVariant(status: TenantApplicationStatus): "default" | "destructive" | "secondary" {
  switch (status) {
    case "approved": return "default";
    case "rejected":
    case "withdrawn": return "destructive";
    default: return "secondary";
  }
}

function StatusIcon({ status }: Readonly<{ status: TenantApplicationStatus }>) {
  switch (status) {
    case "approved":
      return <CheckCircle2 className="size-4 text-success" />;
    case "rejected":
    case "withdrawn":
      return <XCircle className="size-4 text-error" />;
    default:
      return <AlertCircle className="size-4 text-warning" />;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const supabase = await createClient();

  let applications: TenantApplication[] = [];

  try {
    if (role === "landlord") {
      applications = await listApplications(supabase);
    } else {
      applications = await listMyApplications(supabase);
    }
  } catch {
    // User may not be authenticated or table may not exist yet — show empty state
    applications = [];
  }

  const totalCount = applications.length;
  const acceptedCount = applications.filter((a) => a.status === "approved").length;
  const pendingCount = applications.filter((a) =>
    a.status === "received" || a.status === "shortlisted" || a.status === "referencing",
  ).length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rental Applications</h1>
          <p className="text-muted-foreground">
            {role === "landlord"
              ? "Review and manage tenant applications"
              : "Track your rental application status"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Applied</CardDescription>
            <CardTitle className="text-3xl">{totalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Accepted</CardDescription>
            <CardTitle className="text-3xl text-success">{acceptedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Under Review</CardDescription>
            <CardTitle className="text-3xl text-warning">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl text-error">{rejectedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Home className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {role === "landlord"
                  ? "No tenant applications yet. Applications will appear here when renters apply to your properties."
                  : "You haven't submitted any rental applications yet. Browse properties and apply to get started."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{role === "landlord" ? "Applicant" : "Property"}</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employment</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="size-4 text-muted-foreground" />
                        <span className="font-medium">{app.applicant_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{app.applicant_email}</TableCell>
                    <TableCell className="text-sm capitalize">
                      {(app.employment_status ?? "N/A").replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="size-3" />
                        {formatDate(app.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(app.status)}>
                        <StatusIcon status={app.status} />
                        <span className="ml-1">{statusLabel(app.status)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        {app.status === "approved" ? "View Offer" : "View Details"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
