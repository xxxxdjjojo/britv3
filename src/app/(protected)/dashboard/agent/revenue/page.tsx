"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PoundSterling, TrendingUp, Home, BarChart3, Target } from "lucide-react";

const monthlyData = [
    { month: "Oct 2025", sales: 2, revenue: 18500 },
    { month: "Nov 2025", sales: 3, revenue: 24200 },
    { month: "Dec 2025", sales: 1, revenue: 12750 },
    { month: "Jan 2026", sales: 4, revenue: 35600 },
    { month: "Feb 2026", sales: 3, revenue: 28900 },
    { month: "Mar 2026", sales: 2, revenue: 22400 },
];

const recentCommissions = [
    { property: "2 Bed Maisonette, Clapham", salePrice: "£575,000", commission: "£8,625", date: "7 Mar 2026", status: "Paid" },
    { property: "3 Bed End Terrace, Lewisham", salePrice: "£510,000", commission: "£7,650", date: "25 Feb 2026", status: "Pending" },
    { property: "4 Bed Detached, Epsom", salePrice: "£825,000", commission: "£12,375", date: "18 Feb 2026", status: "Paid" },
    { property: "2 Bed Flat, Battersea", salePrice: "£465,000", commission: "£6,975", date: "10 Feb 2026", status: "Paid" },
];

export default function RevenuePage() {
    const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
    const totalSales = monthlyData.reduce((sum, m) => sum + m.sales, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
                <p className="text-muted-foreground">Commission earnings and sales performance</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Total Revenue (6mo)</CardDescription><CardTitle className="text-2xl">£{totalRevenue.toLocaleString()}</CardTitle></CardHeader>
                    <CardContent><div className="flex items-center gap-1 text-xs text-green-600"><TrendingUp className="size-3" />+22.4% vs prior period</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Sales Completed</CardDescription><CardTitle className="text-3xl">{totalSales}</CardTitle></CardHeader>
                    <CardContent><div className="flex items-center gap-1 text-xs text-muted-foreground">Avg: {(totalSales / 6).toFixed(1)}/month</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Avg. Commission</CardDescription><CardTitle className="text-2xl">£{Math.round(totalRevenue / totalSales).toLocaleString()}</CardTitle></CardHeader>
                    <CardContent><div className="flex items-center gap-1 text-xs text-muted-foreground">1.5% standard rate</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Pipeline Value</CardDescription><CardTitle className="text-2xl">£4.45M</CardTitle></CardHeader>
                    <CardContent><div className="flex items-center gap-1 text-xs text-muted-foreground">5 active listings</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Monthly Performance</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {monthlyData.map((m, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <BarChart3 className="size-4 text-muted-foreground" />
                                        <span className="font-medium">{m.month}</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <span className="text-sm text-muted-foreground">{m.sales} sales</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-medium">£{m.revenue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                {i < monthlyData.length - 1 && <Separator className="mt-3" />}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Recent Commissions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {recentCommissions.map((c, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-3">
                                <Home className="size-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{c.property}</p>
                                    <p className="text-xs text-muted-foreground">Sold: {c.salePrice} • {c.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-medium text-green-600">{c.commission}</span>
                                <Badge variant={c.status === "Paid" ? "default" : "secondary"}>{c.status}</Badge>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
