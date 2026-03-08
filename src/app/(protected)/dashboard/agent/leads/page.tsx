"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Phone, Mail, Home, TrendingUp, Clock } from "lucide-react";

const leads = [
    { id: 1, name: "Oliver & Emma Williams", email: "williams@email.com", phone: "07700 111222", interest: "4 Bed Detached, Kensington", budget: "£1.2M–£1.5M", source: "Rightmove", stage: "Viewing Booked", lastContact: "10 Mar 2026" },
    { id: 2, name: "Dr. Priya Sharma", email: "sharma@email.com", phone: "07700 333444", interest: "2 Bed Flat, Canary Wharf", budget: "£450K–£500K", source: "Britestate", stage: "Qualified", lastContact: "9 Mar 2026" },
    { id: 3, name: "James & Sophie Clark", email: "clark@email.com", phone: "07700 555666", interest: "3 Bed Semi, Guildford", budget: "£600K–£700K", source: "Zoopla", stage: "New Enquiry", lastContact: "8 Mar 2026" },
    { id: 4, name: "Marcus Johnson", email: "johnson@email.com", phone: "07700 777888", interest: "Penthouse, South Bank", budget: "£3M–£4M", source: "Referral", stage: "Offer Pending", lastContact: "7 Mar 2026" },
    { id: 5, name: "Lisa & Tom Anderson", email: "anderson@email.com", phone: "07700 999000", interest: "5 Bed Victorian, Richmond", budget: "£2M–£2.5M", source: "Britestate", stage: "New Enquiry", lastContact: "6 Mar 2026" },
];

const stageColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    "New Enquiry": "outline",
    "Qualified": "secondary",
    "Viewing Booked": "default",
    "Offer Pending": "default",
};

export default function LeadsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Leads & Pipeline</h1>
                    <p className="text-muted-foreground">Manage client enquiries and track your sales pipeline</p>
                </div>
                <Button><UserPlus className="mr-2 size-4" />Add Lead</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card><CardHeader className="pb-2"><CardDescription>Total Leads</CardDescription><CardTitle className="text-3xl">5</CardTitle></CardHeader><CardContent><div className="flex items-center gap-1 text-xs text-green-600"><TrendingUp className="size-3" />+3 this week</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardDescription>New Enquiries</CardDescription><CardTitle className="text-3xl text-blue-600">2</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Viewings Booked</CardDescription><CardTitle className="text-3xl text-amber-600">1</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Offers Pending</CardDescription><CardTitle className="text-3xl text-green-600">1</CardTitle></CardHeader></Card>
            </div>

            <Card>
                <CardHeader><CardTitle>All Leads</CardTitle><CardDescription>Sorted by most recent contact</CardDescription></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Interest</TableHead>
                                <TableHead>Budget</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Stage</TableHead>
                                <TableHead>Last Contact</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leads.map((l) => (
                                <TableRow key={l.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-8"><AvatarFallback className="text-xs">{l.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="font-medium">{l.name}</p>
                                                <p className="text-xs text-muted-foreground">{l.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell><div className="flex items-center gap-1"><Home className="size-3 text-muted-foreground" />{l.interest}</div></TableCell>
                                    <TableCell className="font-medium">{l.budget}</TableCell>
                                    <TableCell><Badge variant="outline">{l.source}</Badge></TableCell>
                                    <TableCell><Badge variant={stageColors[l.stage] ?? "secondary"}>{l.stage}</Badge></TableCell>
                                    <TableCell><div className="flex items-center gap-1 text-sm"><Clock className="size-3" />{l.lastContact}</div></TableCell>
                                    <TableCell className="text-right"><Button variant="outline" size="sm">View</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
