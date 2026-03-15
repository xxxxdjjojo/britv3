import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientList } from "@/components/dashboard/agent/crm/ClientList";
import { getCrmClients } from "@/services/agent/agent-crm-service";
import { Users } from "lucide-react";

export const metadata = {
  title: "CRM — Clients",
};

export default async function CrmPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Initial server-side data fetch (first page, no filters)
  let initialClients: Awaited<
    ReturnType<typeof getCrmClients>
  >["clients"] = [];
  let initialTotal = 0;

  try {
    const page = await getCrmClients(supabase, user.id, { limit: 25 });
    initialClients = page.clients;
    initialTotal = page.total;
  } catch (err) {
    console.error("Failed to load CRM clients:", err);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Users className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM — Clients</h1>
          <p className="text-muted-foreground">
            Manage all your buyer, seller, landlord, and tenant relationships in one place.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["buyer", "seller", "landlord", "tenant"] as const).map((type) => {
          const count = initialClients.filter(
            (c) => c.client_type === type,
          ).length;
          const labels: Record<string, string> = {
            buyer: "Buyers",
            seller: "Sellers",
            landlord: "Landlords",
            tenant: "Tenants",
          };
          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardDescription className="capitalize">{labels[type]}</CardDescription>
                <CardTitle className="text-3xl">{count}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  of {initialTotal} total
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Client list */}
      <ClientList
        initialClients={initialClients}
        initialTotal={initialTotal}
      />
    </div>
  );
}
