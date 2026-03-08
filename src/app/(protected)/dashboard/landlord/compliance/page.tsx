"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, AlertTriangle, Clock, Home, FileText, ExternalLink } from "lucide-react";

const properties = [
    {
        name: "2 Bed Flat, Stratford",
        checks: [
            { item: "Gas Safety Certificate (CP12)", status: "Valid", expiry: "15 Jun 2026" },
            { item: "Electrical Safety (EICR)", status: "Valid", expiry: "20 Sep 2027" },
            { item: "Energy Performance Certificate (EPC)", status: "Valid", expiry: "1 Mar 2031", rating: "C (72)" },
            { item: "Smoke & CO Alarms", status: "Valid", expiry: "Annual check due Jun 2026" },
            { item: "Right to Rent Check", status: "Valid", expiry: "N/A — UK nationals" },
            { item: "Deposit Protection (DPS)", status: "Valid", expiry: "Ongoing" },
        ],
    },
    {
        name: "1 Bed Flat, Angel",
        checks: [
            { item: "Gas Safety Certificate (CP12)", status: "Expiring Soon", expiry: "22 Mar 2026" },
            { item: "Electrical Safety (EICR)", status: "Valid", expiry: "14 Aug 2028" },
            { item: "Energy Performance Certificate (EPC)", status: "Valid", expiry: "5 Jan 2030", rating: "B (81)" },
            { item: "Smoke & CO Alarms", status: "Valid", expiry: "Annual check due Aug 2026" },
            { item: "Right to Rent Check", status: "Valid", expiry: "N/A — UK national" },
            { item: "Deposit Protection (DPS)", status: "Valid", expiry: "Ongoing" },
        ],
    },
    {
        name: "3 Bed House, Dulwich",
        checks: [
            { item: "Gas Safety Certificate (CP12)", status: "Valid", expiry: "8 Nov 2026" },
            { item: "Electrical Safety (EICR)", status: "Overdue", expiry: "Expired 1 Feb 2026" },
            { item: "Energy Performance Certificate (EPC)", status: "Valid", expiry: "12 Jul 2029", rating: "D (58)" },
            { item: "Smoke & CO Alarms", status: "Valid", expiry: "Annual check due Nov 2026" },
            { item: "Legionella Risk Assessment", status: "Valid", expiry: "8 Apr 2027" },
            { item: "Deposit Protection (DPS)", status: "Valid", expiry: "Ongoing" },
        ],
    },
];

export default function CompliancePage() {
    const totalChecks = properties.reduce((sum, p) => sum + p.checks.length, 0);
    const overdue = properties.reduce((sum, p) => sum + p.checks.filter(c => c.status === "Overdue").length, 0);
    const expiring = properties.reduce((sum, p) => sum + p.checks.filter(c => c.status === "Expiring Soon").length, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
                    <p className="text-muted-foreground">Legal compliance and certification status for your portfolio</p>
                </div>
                <Button variant="outline"><FileText className="mr-2 size-4" />Download Report</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card><CardHeader className="pb-2"><CardDescription>Total Checks</CardDescription><CardTitle className="text-3xl">{totalChecks}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Compliant</CardDescription><CardTitle className="text-3xl text-green-600">{totalChecks - overdue - expiring}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Expiring Soon</CardDescription><CardTitle className="text-3xl text-amber-600">{expiring}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Overdue</CardDescription><CardTitle className="text-3xl text-red-600">{overdue}</CardTitle></CardHeader></Card>
            </div>

            {properties.map((property, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Home className="size-5" />
                            <CardTitle>{property.name}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {property.checks.map((check, j) => (
                                <div key={j} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex items-center gap-3">
                                        {check.status === "Valid" ? <CheckCircle2 className="size-5 text-green-600" /> : check.status === "Expiring Soon" ? <Clock className="size-5 text-amber-600" /> : <AlertTriangle className="size-5 text-red-600" />}
                                        <div>
                                            <p className="font-medium">{check.item}</p>
                                            <p className="text-sm text-muted-foreground">{check.expiry}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {"rating" in check && <Badge variant="outline">{check.rating}</Badge>}
                                        <Badge variant={check.status === "Valid" ? "default" : check.status === "Expiring Soon" ? "secondary" : "destructive"}>
                                            {check.status}
                                        </Badge>
                                        {check.status !== "Valid" && <Button size="sm" variant="outline">Renew</Button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
