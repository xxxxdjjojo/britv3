"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PoundSterling, TrendingUp, TrendingDown, ArrowUpRight, Home } from "lucide-react";

const properties = [
    { name: "2 Bed Flat, Stratford", rent: 1750, expenses: 320, yield: 5.2, occupancy: "Occupied" },
    { name: "1 Bed Flat, Angel", rent: 2200, expenses: 280, yield: 4.8, occupancy: "Occupied" },
    { name: "Studio, Bermondsey", rent: 1450, expenses: 190, yield: 6.1, occupancy: "Notice Given" },
    { name: "3 Bed House, Dulwich", rent: 2800, expenses: 450, yield: 4.3, occupancy: "Occupied" },
];

export default function FinancesPage() {
    const totalRent = properties.reduce((sum, p) => sum + p.rent, 0);
    const totalExpenses = properties.reduce((sum, p) => sum + p.expenses, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Finances</h1>
                <p className="text-muted-foreground">Portfolio financial overview and income tracking</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Monthly Income</CardDescription><CardTitle className="text-2xl">£{totalRent.toLocaleString()}</CardTitle></CardHeader>
                    <CardContent><div className="flex items-center gap-1 text-xs text-green-600"><TrendingUp className="size-3" />+8.2% vs last month</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Monthly Expenses</CardDescription><CardTitle className="text-2xl">£{totalExpenses.toLocaleString()}</CardTitle></CardHeader>
                    <CardContent><div className="flex items-center gap-1 text-xs text-red-600"><TrendingDown className="size-3" />+3.1% vs last month</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Net Income</CardDescription><CardTitle className="text-2xl">£{(totalRent - totalExpenses).toLocaleString()}</CardTitle></CardHeader>
                    <CardContent><div className="flex items-center gap-1 text-xs text-green-600"><TrendingUp className="size-3" />+9.5% vs last month</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Avg. Yield</CardDescription><CardTitle className="text-2xl">5.1%</CardTitle></CardHeader>
                    <CardContent><div className="flex items-center gap-1 text-xs text-muted-foreground">UK avg: 4.6%</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Property Breakdown</CardTitle><CardDescription>Monthly income and expenses by property</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    {properties.map((p, i) => (
                        <div key={i}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Home className="size-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">{p.name}</p>
                                        <Badge variant={p.occupancy === "Occupied" ? "outline" : "secondary"} className="mt-1">{p.occupancy}</Badge>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Rent</p>
                                            <p className="font-medium text-green-600">+£{p.rent.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Expenses</p>
                                            <p className="font-medium text-red-600">-£{p.expenses.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Net</p>
                                            <p className="font-bold">£{(p.rent - p.expenses).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Yield</p>
                                            <p className="font-medium">{p.yield}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {i < properties.length - 1 && <Separator className="mt-4" />}
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {[
                        { date: "8 Mar", desc: "Rent received — Stratford", amount: "+£1,750", type: "income" },
                        { date: "7 Mar", desc: "British Gas — Boiler repair", amount: "-£245", type: "expense" },
                        { date: "5 Mar", desc: "Rent received — Angel", amount: "+£2,200", type: "income" },
                        { date: "3 Mar", desc: "Buildings insurance — Dulwich", amount: "-£89", type: "expense" },
                        { date: "1 Mar", desc: "Rent received — Bermondsey", amount: "+£1,450", type: "income" },
                    ].map((tx, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <p className="font-medium">{tx.desc}</p>
                                <p className="text-xs text-muted-foreground">{tx.date} 2026</p>
                            </div>
                            <p className={`font-medium ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>{tx.amount}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
