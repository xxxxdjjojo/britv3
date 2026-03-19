import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PoundSterling, TrendingUp, Home, BarChart3 } from "lucide-react";
import { getAgentPerformanceReport } from "@/services/agent/agent-analytics-service";
import type { AgentCommission } from "@/types/agent";

function penceToGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

function formatMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function RevenuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let report: Awaited<ReturnType<typeof getAgentPerformanceReport>> = {
    listings_sold_count: 0,
    avg_time_on_market_days: 0,
    total_revenue: 0,
    conversion_rate: 0,
    client_satisfaction: 0,
    listings_sold_per_month: [],
    revenue_per_month: [],
  };
  let recentCommissions: AgentCommission[] = [];

  try {
    report = await getAgentPerformanceReport(supabase, user.id);
  } catch {
    // empty state
  }

  try {
    const { data } = await supabase
      .from("agent_commissions")
      .select("*")
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    recentCommissions = (data ?? []) as AgentCommission[];
  } catch {
    // empty state
  }

  const avgCommission =
    report.listings_sold_count > 0
      ? Math.round(report.total_revenue / report.listings_sold_count)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
        <p className="text-muted-foreground">Commission earnings and sales performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">{penceToGBP(report.total_revenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <PoundSterling className="size-3" />
              All time
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sales Completed</CardDescription>
            <CardTitle className="text-3xl">{report.listings_sold_count}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              Accepted offers
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Commission</CardDescription>
            <CardTitle className="text-2xl">{penceToGBP(avgCommission)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              Per completed sale
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conversion Rate</CardDescription>
            <CardTitle className="text-2xl">
              {(report.conversion_rate * 100).toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="size-3" />
              Leads to closed
            </div>
          </CardContent>
        </Card>
      </div>

      {report.revenue_per_month.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.revenue_per_month.map((m: { month: string; amount: number }, i: number) => (
                <div key={m.month}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="size-4 text-muted-foreground" />
                      <span className="font-medium">{formatMonth(m.month)}</span>
                    </div>
                    <span className="font-medium">{penceToGBP(m.amount)}</span>
                  </div>
                  {i < report.revenue_per_month.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Recent Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCommissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No commissions recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentCommissions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Home className="size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        Property {c.property_id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sale: {penceToGBP(c.sale_price)} &bull; {formatDate(c.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-green-600">
                      {penceToGBP(c.commission_amount)}
                    </span>
                    <Badge variant={c.status === "paid" ? "default" : "secondary"}>
                      {c.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
