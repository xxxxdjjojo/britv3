"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PoundSterling, TrendingUp, TrendingDown, Clock, Home } from "lucide-react";

const offers = [
    { id: 1, property: "4 Bed Detached, Kensington", asking: "£1,250,000", offered: "£1,200,000", buyer: "Mr. Williams", date: "10 Mar 2026", status: "Pending" },
    { id: 2, property: "4 Bed Detached, Kensington", asking: "£1,250,000", offered: "£1,180,000", buyer: "Ms. Patel", date: "8 Mar 2026", status: "Declined" },
    { id: 3, property: "2 Bed Maisonette, Clapham", asking: "£575,000", offered: "£575,000", buyer: "Mr. & Mrs. Green", date: "7 Mar 2026", status: "Accepted" },
    { id: 4, property: "2 Bed Maisonette, Clapham", asking: "£575,000", offered: "£550,000", buyer: "Dr. Khan", date: "5 Mar 2026", status: "Declined" },
    { id: 5, property: "2 Bed Maisonette, Clapham", asking: "£575,000", offered: "£560,000", buyer: "Ms. Rodriguez", date: "3 Mar 2026", status: "Expired" },
];

export default function OffersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Offers & Negotiations</h1>
                <p className="text-muted-foreground">Review and manage offers on your properties</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Total Offers</CardDescription><CardTitle className="text-3xl">5</CardTitle></CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Pending</CardDescription><CardTitle className="text-3xl text-amber-600">1</CardTitle></CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Accepted</CardDescription><CardTitle className="text-3xl text-green-600">1</CardTitle></CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Highest Offer</CardDescription><CardTitle className="text-2xl">£1,200,000</CardTitle></CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>All Offers</CardTitle><CardDescription>Sorted by most recent</CardDescription></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>Asking Price</TableHead>
                                <TableHead>Offer Amount</TableHead>
                                <TableHead>Buyer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {offers.map((o) => (
                                <TableRow key={o.id}>
                                    <TableCell><div className="flex items-center gap-2"><Home className="size-4 text-muted-foreground" /><span className="font-medium">{o.property}</span></div></TableCell>
                                    <TableCell className="text-muted-foreground">{o.asking}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 font-medium">
                                            <PoundSterling className="size-3" />{o.offered.replace("£", "")}
                                            {o.offered >= o.asking ? <TrendingUp className="size-3 text-green-600" /> : <TrendingDown className="size-3 text-red-600" />}
                                        </div>
                                    </TableCell>
                                    <TableCell>{o.buyer}</TableCell>
                                    <TableCell><div className="flex items-center gap-1 text-sm"><Clock className="size-3" />{o.date}</div></TableCell>
                                    <TableCell>
                                        <Badge variant={o.status === "Accepted" ? "default" : o.status === "Pending" ? "secondary" : "outline"}>
                                            {o.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {o.status === "Pending" ? (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm">Accept</Button>
                                                <Button variant="outline" size="sm">Counter</Button>
                                            </div>
                                        ) : (
                                            <Button variant="ghost" size="sm">View</Button>
                                        )}
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
