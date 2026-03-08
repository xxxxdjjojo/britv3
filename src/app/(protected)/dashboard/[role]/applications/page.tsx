"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Clock, Home, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const applications = [
    { id: 1, property: "1 Bed Flat, Angel", landlord: "Mrs. Thompson", rent: "£2,200/mo", applied: "8 Mar 2026", moveIn: "1 Apr 2026", status: "Under Review" },
    { id: 2, property: "2 Bed Flat, Brixton", landlord: "Mr. Okafor", rent: "£1,650/mo", applied: "5 Mar 2026", moveIn: "15 Mar 2026", status: "Accepted" },
    { id: 3, property: "Studio, Bermondsey", landlord: "Capital Lettings", rent: "£1,450/mo", applied: "1 Mar 2026", moveIn: "1 Apr 2026", status: "Rejected" },
    { id: 4, property: "2 Bed Flat, Stratford", landlord: "Mr. & Mrs. Chen", rent: "£1,750/mo", applied: "25 Feb 2026", moveIn: "1 Mar 2026", status: "Accepted" },
    { id: 5, property: "1 Bed Flat, Peckham", landlord: "Peckham Homes Ltd", rent: "£1,350/mo", applied: "20 Feb 2026", moveIn: "15 Mar 2026", status: "Under Review" },
];

const statusIcon = (status: string) => {
    switch (status) {
        case "Accepted": return <CheckCircle2 className="size-4 text-green-600" />;
        case "Rejected": return <XCircle className="size-4 text-red-600" />;
        default: return <AlertCircle className="size-4 text-amber-600" />;
    }
};

export default function ApplicationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Rental Applications</h1>
                    <p className="text-muted-foreground">Track your rental application status</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Total Applied</CardDescription><CardTitle className="text-3xl">5</CardTitle></CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Accepted</CardDescription><CardTitle className="text-3xl text-green-600">2</CardTitle></CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Under Review</CardDescription><CardTitle className="text-3xl text-amber-600">2</CardTitle></CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Rejected</CardDescription><CardTitle className="text-3xl text-red-600">1</CardTitle></CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>All Applications</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>Landlord</TableHead>
                                <TableHead>Rent</TableHead>
                                <TableHead>Applied</TableHead>
                                <TableHead>Move-in Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.map((app) => (
                                <TableRow key={app.id}>
                                    <TableCell><div className="flex items-center gap-2"><Home className="size-4 text-muted-foreground" /><span className="font-medium">{app.property}</span></div></TableCell>
                                    <TableCell>{app.landlord}</TableCell>
                                    <TableCell className="font-medium">{app.rent}</TableCell>
                                    <TableCell><div className="flex items-center gap-1 text-sm"><Clock className="size-3" />{app.applied}</div></TableCell>
                                    <TableCell>{app.moveIn}</TableCell>
                                    <TableCell>
                                        <Badge variant={app.status === "Accepted" ? "default" : app.status === "Rejected" ? "destructive" : "secondary"}>
                                            {statusIcon(app.status)}<span className="ml-1">{app.status}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm">{app.status === "Accepted" ? "View Offer" : "View Details"}</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
