"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Heart, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ListingAnalytics } from "@/services/agent/agent-listings-service";

// Generate placeholder weekly data for saves/enquiries
function generateWeeklyData() {
  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
  return weeks.map((week) => ({
    week,
    saves: Math.floor(Math.random() * 10) + 1,
    enquiries: Math.floor(Math.random() * 5) + 1,
  }));
}

export function ListingAnalyticsCharts(
  props: Readonly<{ analytics: ListingAnalytics; listingId: string }>,
) {
  const { analytics } = props;

  const dailyData = analytics.daily_views.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    views: d.count,
  }));

  const weeklyData = generateWeeklyData();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" render={<Link href="/dashboard/agent/listings" />}>
          <ArrowLeft className="mr-1 size-4" />
          Back to Listings
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Listing Analytics
          </h1>
          <p className="text-muted-foreground">
            Performance data for the last 30 days
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="size-4" />
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.total_views}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Heart className="size-4" />
              Total Saves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.total_saves}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MessageSquare className="size-4" />
              Total Enquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.total_enquiries}</p>
          </CardContent>
        </Card>
      </div>

      {/* Views line chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Views (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No view data available yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Saves / Enquiries bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Saves & Enquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="saves" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="enquiries" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
