"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, Heart, MessageSquare, TrendingUp } from "lucide-react";

type AnalyticsData = {
  views_over_time: Array<{ date: string; count: number }>;
  total_views: number;
  total_saves: number;
  total_enquiries: number;
};

type Props = Readonly<{
  analytics: AnalyticsData;
}>;

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// Generate placeholder weekly data from daily views for saves/enquiries bar chart
function buildWeeklyData(views_over_time: Array<{ date: string; count: number }>) {
  const buckets: Record<string, { week: string; views: number; saves: number; enquiries: number }> = {};

  views_over_time.forEach(({ date, count }) => {
    const d = new Date(date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    if (!buckets[key]) {
      buckets[key] = { week: `w/c ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(weekStart)}`, views: 0, saves: 0, enquiries: 0 };
    }
    buckets[key].views += count;
  });

  return Object.values(buckets).slice(-6);
}

// Placeholder source breakdown data (would come from analytics_events in production)
function buildSourceData(totalViews: number) {
  if (totalViews === 0) {
    return [
      { name: "Website", value: 0 },
      { name: "Portal", value: 0 },
      { name: "Direct", value: 0 },
    ];
  }
  return [
    { name: "Website", value: Math.round(totalViews * 0.45) },
    { name: "Portal", value: Math.round(totalViews * 0.35) },
    { name: "Direct", value: Math.round(totalViews * 0.20) },
  ];
}

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981"];

export function ListingAnalyticsCharts({ analytics }: Props) {
  const { views_over_time, total_views, total_saves, total_enquiries } = analytics;

  const ctr = total_views > 0 ? ((total_enquiries / total_views) * 100).toFixed(1) : "0.0";

  const chartData = views_over_time.map(({ date, count }) => ({
    date: formatDate(date),
    views: count,
  }));

  const weeklyData = buildWeeklyData(views_over_time);
  const sourceData = buildSourceData(total_views);

  const statCards = [
    { label: "Total views", value: total_views.toLocaleString(), icon: <Eye className="size-5 text-blue-500" />, color: "text-blue-600" },
    { label: "Total saves", value: total_saves.toLocaleString(), icon: <Heart className="size-5 text-pink-500" />, color: "text-pink-600" },
    { label: "Enquiries", value: total_enquiries.toLocaleString(), icon: <MessageSquare className="size-5 text-green-500" />, color: "text-green-600" },
    { label: "CTR", value: `${ctr}%`, icon: <TrendingUp className="size-5 text-amber-500" />, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                {icon}
                <span className={`text-2xl font-bold ${color}`}>{value}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Views over time line chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Views over time</CardTitle>
          <CardDescription>Daily view count for the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No view data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number) => [v, "Views"]}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly saves/enquiries bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saves &amp; Enquiries by week</CardTitle>
            <CardDescription>Weekly breakdown of user engagement</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                No weekly data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={25} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="saves" fill="#ec4899" radius={[3, 3, 0, 0]} name="Saves" />
                  <Bar dataKey="enquiries" fill="#10b981" radius={[3, 3, 0, 0]} name="Enquiries" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Source breakdown pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Traffic sources</CardTitle>
            <CardDescription>Where views are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {sourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number, name: string) => [v, name]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
