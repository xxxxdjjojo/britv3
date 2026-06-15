import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/market-map/ConfidenceBadge";
import { AreaExplorerControls } from "@/components/market-map/AreaExplorerControls";
import { AreaExplorerMap } from "@/components/market-map/AreaExplorerMap";
import { AreaTrendChart } from "@/components/market-map/AreaTrendChart";
import { SubAreaTable } from "@/components/market-map/SubAreaTable";
import { RecentTransactionsTable } from "@/components/market-map/RecentTransactionsTable";
import { parseMarketMapQuery } from "@/lib/market-map/query";
import { resolveArea } from "@/lib/market-map/areas";
import { formatPounds, formatMonthRange } from "@/lib/market-map/format";
import {
  getAreaOverview,
  getAreaTrend,
  getRecentTransactions,
} from "@/services/market-map/market-map-service";

const DISCLAIMER =
  "Based on registered sold-price transactions. This is not a £/m² estimate because floor-area data is not currently available.";

type PageProps = {
  params: Promise<{ area: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { area } = await params;
  const borough = resolveArea(area);
  return {
    title: `${borough.label} sold-price market map`,
    description: `Median registered sold price by postcode district across ${borough.label}, from HM Land Registry data.`,
  };
}

export default async function AreaExplorerPage({ params, searchParams }: PageProps) {
  const { area } = await params;
  const sp = await searchParams;
  const query = parseMarketMapQuery({ ...sp, area });
  const borough = resolveArea(query.area);

  const [{ collection, summary }, trend, transactions] = await Promise.all([
    getAreaOverview(query),
    getAreaTrend(query),
    getRecentTransactions(query, { limit: 12 }),
  ]);

  const period = formatMonthRange(query.from_date, query.to_date);

  const months = monthsBetween(query.from_date, query.to_date);
  const geographyLevel = query.geography_level;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/search/map">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to map
          </Link>
        </Button>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Market insights
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {borough.label}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Median sold price by postcode district · {period}
          </p>
        </div>
        <AreaExplorerControls
          propertyType={query.property_type}
          months={months}
          geographyLevel={geographyLevel}
        />
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          title="Median sold price"
          value={summary.median_price != null ? formatPounds(summary.median_price) : "—"}
        />
        <SummaryCard
          title="Transactions"
          value={summary.transaction_count.toLocaleString("en-GB")}
        />
        <SummaryCard title="Data period" value={period} small />
        <Card className="gap-0">
          <CardHeader className="pb-1">
            <CardTitle className="text-[0.7rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConfidenceBadge confidence={summary.confidence} />
          </CardContent>
        </Card>
      </div>

      {/* Map + trend */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AreaExplorerMap
            data={collection}
            scaleLabel={`Local scale · ${borough.label}`}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Market evolution</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaTrendChart data={trend} />
          </CardContent>
        </Card>
      </div>

      {/* Ranked sub-areas */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">
            Districts ranked by median sold price
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SubAreaTable areas={summary.sub_areas} />
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTransactionsTable transactions={transactions} />
        </CardContent>
      </Card>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  small,
}: Readonly<{ title: string; value: string; small?: boolean }>) {
  return (
    <Card className="gap-0">
      <CardHeader className="pb-1">
        <CardTitle className="text-[0.7rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={small ? "font-heading text-base font-semibold" : "font-heading text-2xl font-bold"}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function monthsBetween(from: string, to: string): number {
  const f = new Date(`${from}T00:00:00Z`);
  const t = new Date(`${to}T00:00:00Z`);
  const months =
    (t.getUTCFullYear() - f.getUTCFullYear()) * 12 +
    (t.getUTCMonth() - f.getUTCMonth());
  return [12, 24, 36, 60].includes(months) ? months : 36;
}
