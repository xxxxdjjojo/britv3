"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, AlertTriangle, Clock, Home, Plus } from "lucide-react";

const requests = [
    { id: 1, property: "2 Bed Flat, Stratford", issue: "Boiler not heating water", tenant: "James Miller", priority: "Urgent", reported: "7 Mar 2026", status: "In Progress", contractor: "British Gas" },
    { id: 2, property: "1 Bed Flat, Angel", issue: "Leaking kitchen tap", tenant: "Dr. Clarke", priority: "Medium", reported: "5 Mar 2026", status: "Awaiting Contractor", contractor: "—" },
    { id: 3, property: "3 Bed House, Dulwich", issue: "Broken window latch (bedroom 2)", tenant: "Michael Brown", priority: "Low", reported: "3 Mar 2026", status: "Scheduled", contractor: "Ace Windows" },
    { id: 4, property: "Studio, Bermondsey", issue: "Damp patch on bathroom ceiling", tenant: "Emily Watson", priority: "Medium", reported: "28 Feb 2026", status: "Completed", contractor: "DampFix Ltd" },
    { id: 5, property: "2 Bed Flat, Stratford", issue: "Intercom buzzer faulty", tenant: "James Miller", priority: "Low", reported: "20 Feb 2026", status: "Completed", contractor: "SecureEntry" },
];

export default function MaintenancePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
                    <p className="text-muted-foreground">Track and manage property maintenance requests</p>
                </div>
                <Button><Plus className="mr-2 size-4" />Log Request</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card><CardHeader className="pb-2"><CardDescription>Open Requests</CardDescription><CardTitle className="text-3xl text-amber-600">3</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Urgent</CardDescription><CardTitle className="text-3xl text-red-600">1</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Completed (Mar)</CardDescription><CardTitle className="text-3xl text-green-600">2</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Avg Resolution</CardDescription><CardTitle className="text-3xl">4.2 days</CardTitle></CardHeader></Card>
            </div>

            <Tabs defaultValue="open">
                <TabsList>
                    <TabsTrigger value="open">Open (3)</TabsTrigger>
                    <TabsTrigger value="completed">Completed (2)</TabsTrigger>
                </TabsList>
                <TabsContent value="open">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Issue</TableHead>
                                        <TableHead>Property</TableHead>
                                        <TableHead>Tenant</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Reported</TableHead>
                                        <TableHead>Contractor</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.filter(r => r.status !== "Completed").map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell><div className="flex items-center gap-2"><Wrench className="size-4 text-muted-foreground" /><span className="font-medium">{r.issue}</span></div></TableCell>
                                            <TableCell><div className="flex items-center gap-1 text-sm"><Home className="size-3" />{r.property}</div></TableCell>
                                            <TableCell>{r.tenant}</TableCell>
                                            <TableCell><Badge variant={r.priority === "Urgent" ? "destructive" : r.priority === "Medium" ? "secondary" : "outline"}>{r.priority === "Urgent" && <AlertTriangle className="mr-1 size-3" />}{r.priority}</Badge></TableCell>
                                            <TableCell><div className="flex items-center gap-1 text-sm"><Clock className="size-3" />{r.reported}</div></TableCell>
                                            <TableCell>{r.contractor}</TableCell>
                                            <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="completed">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader><TableRow><TableHead>Issue</TableHead><TableHead>Property</TableHead><TableHead>Contractor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {requests.filter(r => r.status === "Completed").map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-medium">{r.issue}</TableCell>
                                            <TableCell>{r.property}</TableCell>
                                            <TableCell>{r.contractor}</TableCell>
                                            <TableCell><Badge>Completed</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
