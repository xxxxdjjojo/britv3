"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, MapPin, User, Plus, CheckCircle2 } from "lucide-react";

const viewings = [
    { id: 1, property: "4 Bed Detached, Kensington", client: "Oliver Williams", time: "10:00 AM", date: "12 Mar 2026", duration: "30 min", status: "Confirmed" },
    { id: 2, property: "Penthouse, South Bank", client: "Marcus Johnson", time: "11:30 AM", date: "12 Mar 2026", duration: "45 min", status: "Confirmed" },
    { id: 3, property: "2 Bed Flat, Canary Wharf", client: "Dr. Sharma", time: "2:00 PM", date: "13 Mar 2026", duration: "30 min", status: "Pending" },
    { id: 4, property: "3 Bed Semi, Guildford", client: "James Clark", time: "10:30 AM", date: "14 Mar 2026", duration: "30 min", status: "Confirmed" },
    { id: 5, property: "5 Bed Victorian, Richmond", client: "Lisa Anderson", time: "3:00 PM", date: "15 Mar 2026", duration: "45 min", status: "Pending" },
];

export default function AgentViewingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Viewings Calendar</h1>
                    <p className="text-muted-foreground">Schedule and manage property viewings for clients</p>
                </div>
                <Button><Plus className="mr-2 size-4" />Schedule Viewing</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card><CardHeader className="pb-2"><CardDescription>Today</CardDescription><CardTitle className="text-3xl">2</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>This Week</CardDescription><CardTitle className="text-3xl">5</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Confirmed</CardDescription><CardTitle className="text-3xl text-green-600">3</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Pending Confirmation</CardDescription><CardTitle className="text-3xl text-amber-600">2</CardTitle></CardHeader></Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Upcoming Viewings</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {viewings.map((v) => (
                                <TableRow key={v.id}>
                                    <TableCell className="font-medium">{v.property}</TableCell>
                                    <TableCell><div className="flex items-center gap-1"><User className="size-3" />{v.client}</div></TableCell>
                                    <TableCell><div className="flex items-center gap-1"><Calendar className="size-3" />{v.date}</div></TableCell>
                                    <TableCell><div className="flex items-center gap-1"><Clock className="size-3" />{v.time}</div></TableCell>
                                    <TableCell>{v.duration}</TableCell>
                                    <TableCell><Badge variant={v.status === "Confirmed" ? "default" : "secondary"}>{v.status === "Confirmed" && <CheckCircle2 className="mr-1 size-3" />}{v.status}</Badge></TableCell>
                                    <TableCell className="text-right"><Button variant="outline" size="sm">Manage</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
