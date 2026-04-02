import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Calendar, PoundSterling, User, FileText, Wrench, Mail } from "lucide-react";

function formatDateGB(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

function TenancySkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-36" />
          <Skeleton className="h-28" />
        </div>
      </div>
    </div>
  );
}

async function TenancyContent({ role }: Readonly<{ role: string }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tenancy } = await supabase
    .from("tenancies")
    .select(`
      id, status, lease_start_date, lease_end_date,
      rent_amount, rent_frequency, deposit_amount, deposit_scheme,
      tenant_name, landlord_id,
      properties(address_line1, address_line2, city, postcode, property_type, bedrooms)
    `)
    .eq("tenant_user_id", user.id)
    .in("status", ["active", "ending_soon"])
    .order("lease_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!tenancy) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Current Tenancy</h1>
          <p className="text-muted-foreground">Your active rental agreement details</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Home className="size-12 text-muted-foreground/40" />
            <div>
              <h2 className="text-lg font-semibold">No Active Tenancy</h2>
              <p className="text-muted-foreground mt-1 max-w-md">
                You don&apos;t have an active tenancy yet. Once your rental application is approved, your tenancy details will appear here.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/search">Browse Rentals</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: landlord } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", tenancy.landlord_id)
    .maybeSingle();

  const property = Array.isArray(tenancy.properties)
    ? tenancy.properties[0]
    : tenancy.properties;

  const propertyTitle = property
    ? `${property.bedrooms ?? ""} Bed ${capitalise(property.property_type ?? "property")}, ${property.city ?? ""}`
    : "Your Property";

  const propertyAddress = property
    ? [property.address_line1, property.address_line2, property.city, property.postcode]
        .filter(Boolean)
        .join(", ")
    : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Current Tenancy</h1>
        <p className="text-muted-foreground">Your active rental agreement details</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{propertyTitle}</CardTitle>
              <Badge>{capitalise(tenancy.status)}</Badge>
            </div>
            <CardDescription>{propertyAddress}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Calendar className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Lease Period</p>
                  <p className="font-medium">
                    {formatDateGB(tenancy.lease_start_date)} — {formatDateGB(tenancy.lease_end_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PoundSterling className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="font-medium">
                    £{Number(tenancy.rent_amount).toLocaleString("en-GB")}/mo
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Home className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Property Type</p>
                  <p className="font-medium">
                    {property
                      ? `${property.bedrooms ?? ""} Bed ${capitalise(property.property_type ?? "property")}`
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PoundSterling className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Deposit Held</p>
                  <p className="font-medium">
                    £{Number(tenancy.deposit_amount ?? 0).toLocaleString("en-GB")}
                    {tenancy.deposit_scheme ? ` (${tenancy.deposit_scheme})` : ""}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-3 font-semibold">Lease Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenant</span>
                  <span className="font-medium">{tenancy.tenant_name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rent Frequency</span>
                  <span className="font-medium">{capitalise(tenancy.rent_frequency ?? "monthly")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lease Start</span>
                  <span className="font-medium">{formatDateGB(tenancy.lease_start_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lease End</span>
                  <span className="font-medium">{formatDateGB(tenancy.lease_end_date)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Landlord</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span>{landlord?.full_name ?? "Your Landlord"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <span>{landlord?.email ?? "—"}</span>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/${role}/messages`}>Message Landlord</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Wrench className="mr-2 size-4" />Report Maintenance
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/${role}/documents`}>
                  <FileText className="mr-2 size-4" />View Lease Agreement
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/${role}/billing`}>
                  <PoundSterling className="mr-2 size-4" />Payment History
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Important Dates</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lease Start</span>
                <span className="font-medium">{formatDateGB(tenancy.lease_start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lease End</span>
                <span className="font-medium">{formatDateGB(tenancy.lease_end_date)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function TenancyPage({
  params,
}: Readonly<{ params: Promise<{ role: string }> }>) {
  const { role } = await params;

  return (
    <Suspense fallback={<TenancySkeleton />}>
      <TenancyContent role={role} />
    </Suspense>
  );
}
