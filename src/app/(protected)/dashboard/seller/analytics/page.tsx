import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/StatCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import { TrendingUp } from "lucide-react";

// ---------------------------------------------------------------------------
// Placeholder data (replaced by real API data in Wave 1)
// ---------------------------------------------------------------------------

const kpis = [
  { label: "Total Views", value: "12,482", change: 8, trend: "up", icon: "Eye" },
  { label: "Enquiries", value: "8,103", change: 5, trend: "up", icon: "Users" },
  { label: "Saves", value: "412", change: 3, trend: "up", icon: "Heart" },
  { label: "Viewings", value: "86", change: 2, trend: "up", icon: "Calendar" },
] as const;

// Daily views, charted as a green area trend (see SVG path below).
const viewsTrend = [
  18, 22, 20, 28, 26, 34, 30, 38, 44, 40, 52, 48, 60, 56, 68, 64, 72,
];
const enquiriesTrend = [
  6, 8, 7, 9, 11, 10, 14, 12, 16, 15, 19, 18, 22, 21, 25, 24, 28,
];

const leadSources = [
  { label: "Property Search", share: 46, tone: "bg-brand-primary" },
  { label: "Saved Searches", share: 27, tone: "bg-brand-primary-light" },
  { label: "Direct Link", share: 18, tone: "bg-brand-gold" },
  { label: "Referrals", share: 9, tone: "bg-border" },
] as const;

const recentActivity = [
  {
    id: 1,
    date: "12 Jun 2026",
    event: "Enquiry",
    source: "Property Search",
    location: "Surrey",
  },
  {
    id: 2,
    date: "11 Jun 2026",
    event: "Saved",
    source: "Saved Searches",
    location: "London",
  },
  {
    id: 3,
    date: "10 Jun 2026",
    event: "Viewing booked",
    source: "Direct Link",
    location: "Guildford",
  },
  {
    id: 4,
    date: "09 Jun 2026",
    event: "Enquiry",
    source: "Referral",
    location: "Woking",
  },
] as const;

// ---------------------------------------------------------------------------
// Inline SVG trend chart (green palette, no runtime dependency)
// ---------------------------------------------------------------------------

const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;

function buildPath(series: readonly number[]): { line: string; area: string } {
  const max = Math.max(...series);
  const stepX = CHART_WIDTH / (series.length - 1);
  const points = series.map((value, index) => {
    const x = index * stepX;
    const y = CHART_HEIGHT - (value / max) * (CHART_HEIGHT - 16) - 8;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M ${points.join(" L ")}`;
  const area = `${line} L ${CHART_WIDTH},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z`;
  return { line, area };
}

function TrendChart({
  title,
  series,
  stroke,
  gradientId,
}: Readonly<{
  title: string;
  series: readonly number[];
  stroke: string;
  gradientId: string;
}>) {
  const { line, area } = buildPath(series);

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="font-heading text-base font-bold tracking-tight text-neutral-900">
        {title}
      </h3>
      <svg
        role="img"
        aria-label={`${title} trend`}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="mt-5 h-44 w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.18} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ListingAnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Editorial page heading */}
      <header className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Listing Performance
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
          Listing Analytics
        </h1>
        <p className="text-muted-foreground">
          Track views, enquiries and engagement across your active listings.
        </p>
      </header>

      {/* KPI stat tiles */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            change={kpi.change}
            trend={kpi.trend}
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* Trend charts */}
      <div className="space-y-4">
        <SectionHeader title="Engagement Trends" />
        <div className="grid gap-6 lg:grid-cols-2">
          <TrendChart
            title="Views Over Time"
            series={viewsTrend}
            stroke="var(--color-brand-primary)"
            gradientId="viewsTrendGradient"
          />
          <TrendChart
            title="Enquiries Over Time"
            series={enquiriesTrend}
            stroke="#2D7A5F"
            gradientId="enquiriesTrendGradient"
          />
        </div>
      </div>

      {/* Lead distribution + insight */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-heading text-lg font-bold tracking-tight text-neutral-900">
            Lead Distribution
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Where your enquiries are coming from this period.
          </p>
          <ul className="mt-6 space-y-4">
            {leadSources.map((source) => (
              <li key={source.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-900">
                    {source.label}
                  </span>
                  <span className="font-semibold text-brand-primary">
                    {source.share}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${source.tone}`}
                    style={{ width: `${source.share}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <InsightPanel
          eyebrow="Performance Insight"
          title="Unlock higher visibility"
          icon={TrendingUp}
          action={{ label: "Boost Listing", href: "#" }}
        >
          Listings with a premium boost see up to 3x more enquiries. Your views
          are trending up — convert that momentum into viewings.
        </InsightPanel>
      </div>

      {/* Recent activity breakdown */}
      <div className="space-y-4">
        <SectionHeader title="Recent Viewing Activity" />
        <div className="rounded-xl border border-border bg-surface">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.date}
                    </TableCell>
                    <TableCell className="font-medium text-neutral-900">
                      {row.event}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.source}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.location}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
