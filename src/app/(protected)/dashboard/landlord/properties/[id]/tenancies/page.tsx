import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTenancies } from "@/services/landlord/tenancy-service";
import { TenancyStatusBadge } from "@/components/landlord/TenancyStatusBadge";
import { TenancyForm } from "@/components/landlord/TenancyForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TenancyStatus } from "@/types/landlord";

export const metadata = {
  title: "Tenancies | Britestate",
};

export default async function TenanciesPage(
  props: Readonly<{
    params: Promise<{ id: string }>;
    searchParams: Promise<{ new?: string }>;
  }>,
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const showForm = searchParams.new === "true";

  const supabase = await createClient();
  const tenancies = await getTenancies(supabase, id);

  const activeTenancies = tenancies.filter(
    (t) => t.status === "active" || t.status === "ending_soon",
  );
  const pastTenancies = tenancies.filter(
    (t) => t.status === "ended" || t.status === "terminated",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tenancies</h1>
        {!showForm && (
          <Link
            href={`/dashboard/landlord/properties/${id}/tenancies?new=true`}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Add Tenancy
          </Link>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Tenancy</CardTitle>
          </CardHeader>
          <CardContent>
            <TenancyForm propertyId={id} mode="create" />
          </CardContent>
        </Card>
      )}

      {/* Active tenancies */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active</h2>
        {activeTenancies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active tenancies.</p>
        ) : (
          <div className="space-y-3">
            {activeTenancies.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/landlord/properties/${id}/tenancies/${t.id}`}
              >
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <p className="font-medium">{t.tenant_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat("en-GB", {
                          style: "currency",
                          currency: "GBP",
                          minimumFractionDigits: 0,
                        }).format(t.rent_amount)}
                        /{t.rent_frequency}
                        {t.lease_end_date && (
                          <>
                            {" "}
                            &middot; Ends{" "}
                            {new Date(t.lease_end_date).toLocaleDateString("en-GB")}
                          </>
                        )}
                      </p>
                    </div>
                    <TenancyStatusBadge status={t.status as TenancyStatus} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Past tenancies */}
      {pastTenancies.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">History</h2>
          <div className="space-y-3">
            {pastTenancies.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/landlord/properties/${id}/tenancies/${t.id}`}
              >
                <Card className="cursor-pointer opacity-75 transition-shadow hover:opacity-100 hover:shadow-md">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <p className="font-medium">{t.tenant_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(t.lease_start_date).toLocaleDateString("en-GB")}
                        {t.lease_end_date && (
                          <> &ndash; {new Date(t.lease_end_date).toLocaleDateString("en-GB")}</>
                        )}
                      </p>
                    </div>
                    <TenancyStatusBadge status={t.status as TenancyStatus} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
