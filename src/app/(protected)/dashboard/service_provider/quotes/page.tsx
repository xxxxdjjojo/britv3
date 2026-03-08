"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessagesSquare, User, MapPin, Clock, PoundSterling, Send } from "lucide-react";

const quotes = [
    { id: 1, job: "Full Bathroom Renovation", client: "Mrs. Thompson", location: "Stratford, E20", amount: "£4,200", sent: "4 Mar 2026", validUntil: "18 Mar 2026", status: "Accepted" },
    { id: 2, job: "Boiler Service & Repair", client: "James Miller", location: "Stratford, E20", amount: "£320", sent: "10 Mar 2026", validUntil: "24 Mar 2026", status: "Pending" },
    { id: 3, job: "Roof Tile Replacement", client: "Sarah White", location: "Wimbledon, SW19", amount: "£950", sent: "9 Mar 2026", validUntil: "23 Mar 2026", status: "Pending" },
    { id: 4, job: "Damp Treatment", client: "Emily Watson", location: "Bermondsey, SE1", amount: "£780", sent: "8 Mar 2026", validUntil: "22 Mar 2026", status: "Pending" },
    { id: 5, job: "Loft Insulation — whole house", client: "Tom Davies", location: "Croydon, CR0", amount: "£1,400", sent: "1 Mar 2026", validUntil: "15 Mar 2026", status: "Declined" },
];

export default function QuotesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
                    <p className="text-muted-foreground">Manage your quote submissions and responses</p>
                </div>
                <Button><Send className="mr-2 size-4" />New Quote</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card><CardHeader className="pb-2"><CardDescription>Total Sent</CardDescription><CardTitle className="text-3xl">{quotes.length}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Pending</CardDescription><CardTitle className="text-3xl text-amber-600">{quotes.filter(q => q.status === "Pending").length}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Accepted</CardDescription><CardTitle className="text-3xl text-green-600">{quotes.filter(q => q.status === "Accepted").length}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Win Rate</CardDescription><CardTitle className="text-3xl">40%</CardTitle></CardHeader></Card>
            </div>

            <Card>
                <CardHeader><CardTitle>All Quotes</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Job</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Sent</TableHead>
                                <TableHead>Valid Until</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotes.map((q) => (
                                <TableRow key={q.id}>
                                    <TableCell className="font-medium">{q.job}</TableCell>
                                    <TableCell><div className="flex items-center gap-1"><User className="size-3" />{q.client}</div></TableCell>
                                    <TableCell><div className="flex items-center gap-1"><MapPin className="size-3" />{q.location}</div></TableCell>
                                    <TableCell className="font-medium">{q.amount}</TableCell>
                                    <TableCell>{q.sent}</TableCell>
                                    <TableCell>{q.validUntil}</TableCell>
                                    <TableCell><Badge variant={q.status === "Accepted" ? "default" : q.status === "Declined" ? "destructive" : "secondary"}>{q.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
