"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PoundSterling, TrendingUp, BarChart3, Briefcase, ArrowUpRight } from "lucide-react";

const monthlyEarnings = [
    { month: "Oct 2025", jobs: 4, earnings: 2850 },
    { month: "Nov 2025", jobs: 6, earnings: 4200 },
    { month: "Dec 2025", jobs: 3, earnings: 1950 },
    { month: "Jan 2026", jobs: 7, earnings: 5600 },
    { month: "Feb 2026", jobs: 5, earnings: 3800 },
    { month: "Mar 2026", jobs: 3, earnings: 5030 },
];

const pendingPayments = [
    { job: "Full Bathroom Renovation", client: "Mrs. Thompson", amount: 4200, dueDate: "15 Mar 2026" },
    { job: "Kitchen Tap Replacement", client: "Dr. Clarke", amount: 180, dueDate: "19 Mar 2026" },
    { job: "Garden Fence Repair", client: "Mr. Brown", amount: 650, dueDate: "25 Mar 2026" },
];

export default function EarningsPage() {
    const totalEarnings = monthlyEarnings.reduce((sum, m) => sum + m.earnings, 0);
    const totalJobs = monthlyEarnings.reduce((sum, m) => sum + m.jobs, 0);
    const pendingTotal = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
                <p className="text-muted-foreground">Track your income, pending payments, and financial performance</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Total Earnings (6mo)</CardDescription><CardTitle className="text-2xl">£{totalEarnings.toLocaleString()}</CardTitle></CardHeader>
                    <CardContent><div className="flex items-center gap-1 text-xs text-green-600"><TrendingUp className="size-3" />+28% vs prior period</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Jobs Completed</CardDescription><CardTitle className="text-3xl">{totalJobs}</CardTitle></CardHeader>
                    <CardContent><div className="text-xs text-muted-foreground">Avg: {(totalJobs / 6).toFixed(1)}/month</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Avg. Job Value</CardDescription><CardTitle className="text-2xl">£{Math.round(totalEarnings / totalJobs).toLocaleString()}</CardTitle></CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Pending Payments</CardDescription><CardTitle className="text-2xl text-amber-600">£{pendingTotal.toLocaleString()}</CardTitle></CardHeader>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Monthly Breakdown</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {monthlyEarnings.map((m, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <BarChart3 className="size-4 text-muted-foreground" />
                                        <span className="font-medium">{m.month}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-muted-foreground">{m.jobs} jobs</span>
                                        <span className="font-medium">£{m.earnings.toLocaleString()}</span>
                                    </div>
                                </div>
                                {i < monthlyEarnings.length - 1 && <Separator className="mt-3" />}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Pending Payments</CardTitle><CardDescription>Awaiting payment from clients</CardDescription></CardHeader>
                    <CardContent className="space-y-3">
                        {pendingPayments.map((p, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <p className="font-medium">{p.job}</p>
                                    <p className="text-xs text-muted-foreground">{p.client} • Due: {p.dueDate}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">£{p.amount.toLocaleString()}</p>
                                    <Badge variant="secondary">Pending</Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
