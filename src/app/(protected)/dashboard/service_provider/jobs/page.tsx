"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, MapPin, PoundSterling, Clock, User, CheckCircle2 } from "lucide-react";

const activeJobs = [
    { id: 1, title: "Full Bathroom Renovation", client: "Mrs. Thompson", location: "Stratford, E20", value: "£4,200", posted: "8 Mar 2026", deadline: "15 Apr 2026", status: "In Progress" },
    { id: 2, title: "Kitchen Tap Replacement", client: "Dr. Clarke", location: "Angel, N1", value: "£180", posted: "5 Mar 2026", deadline: "12 Mar 2026", status: "Scheduled" },
    { id: 3, title: "Garden Fence Repair", client: "Mr. Brown", location: "Dulwich, SE21", value: "£650", posted: "3 Mar 2026", deadline: "20 Mar 2026", status: "In Progress" },
];

const newLeads = [
    { id: 4, title: "Boiler Service & Repair", client: "James Miller", location: "Stratford, E20", budget: "£200–£400", posted: "10 Mar 2026", urgency: "Urgent" },
    { id: 5, title: "Roof Tile Replacement", client: "Sarah White", location: "Wimbledon, SW19", budget: "£800–£1,200", posted: "9 Mar 2026", urgency: "Normal" },
    { id: 6, title: "Damp Treatment — 2 rooms", client: "Emily Watson", location: "Bermondsey, SE1", budget: "£600–£900", posted: "8 Mar 2026", urgency: "Normal" },
];

const completedJobs = [
    { id: 7, title: "Window Latch Replacement", client: "Michael Brown", location: "Dulwich, SE21", value: "£120", completed: "28 Feb 2026", rating: 5 },
    { id: 8, title: "Intercom Repair", client: "James Miller", location: "Stratford, E20", value: "£85", completed: "25 Feb 2026", rating: 4 },
];

export default function JobsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
                <p className="text-muted-foreground">Manage your active jobs, leads, and completed work</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card><CardHeader className="pb-2"><CardDescription>Active Jobs</CardDescription><CardTitle className="text-3xl">{activeJobs.length}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>New Leads</CardDescription><CardTitle className="text-3xl text-blue-600">{newLeads.length}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Completed (Mar)</CardDescription><CardTitle className="text-3xl text-green-600">{completedJobs.length}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Active Value</CardDescription><CardTitle className="text-2xl">£5,030</CardTitle></CardHeader></Card>
            </div>

            <Tabs defaultValue="active">
                <TabsList>
                    <TabsTrigger value="active">Active ({activeJobs.length})</TabsTrigger>
                    <TabsTrigger value="leads">New Leads ({newLeads.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedJobs.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="active">
                    <Card><CardContent className="p-0">
                        <Table>
                            <TableHeader><TableRow><TableHead>Job</TableHead><TableHead>Client</TableHead><TableHead>Location</TableHead><TableHead>Value</TableHead><TableHead>Deadline</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {activeJobs.map((j) => (
                                    <TableRow key={j.id}>
                                        <TableCell className="font-medium">{j.title}</TableCell>
                                        <TableCell><div className="flex items-center gap-1"><User className="size-3" />{j.client}</div></TableCell>
                                        <TableCell><div className="flex items-center gap-1"><MapPin className="size-3" />{j.location}</div></TableCell>
                                        <TableCell className="font-medium">{j.value}</TableCell>
                                        <TableCell><div className="flex items-center gap-1"><Clock className="size-3" />{j.deadline}</div></TableCell>
                                        <TableCell><Badge variant="secondary">{j.status}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent></Card>
                </TabsContent>
                <TabsContent value="leads">
                    <Card><CardContent className="p-0">
                        <Table>
                            <TableHeader><TableRow><TableHead>Job</TableHead><TableHead>Client</TableHead><TableHead>Location</TableHead><TableHead>Budget</TableHead><TableHead>Posted</TableHead><TableHead>Urgency</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {newLeads.map((l) => (
                                    <TableRow key={l.id}>
                                        <TableCell className="font-medium">{l.title}</TableCell>
                                        <TableCell>{l.client}</TableCell>
                                        <TableCell><div className="flex items-center gap-1"><MapPin className="size-3" />{l.location}</div></TableCell>
                                        <TableCell>{l.budget}</TableCell>
                                        <TableCell>{l.posted}</TableCell>
                                        <TableCell><Badge variant={l.urgency === "Urgent" ? "destructive" : "outline"}>{l.urgency}</Badge></TableCell>
                                        <TableCell className="text-right"><Button size="sm">Send Quote</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent></Card>
                </TabsContent>
                <TabsContent value="completed">
                    <Card><CardContent className="p-0">
                        <Table>
                            <TableHeader><TableRow><TableHead>Job</TableHead><TableHead>Client</TableHead><TableHead>Value</TableHead><TableHead>Completed</TableHead><TableHead>Rating</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {completedJobs.map((j) => (
                                    <TableRow key={j.id}>
                                        <TableCell className="font-medium">{j.title}</TableCell>
                                        <TableCell>{j.client}</TableCell>
                                        <TableCell className="font-medium">{j.value}</TableCell>
                                        <TableCell>{j.completed}</TableCell>
                                        <TableCell><Badge><CheckCircle2 className="mr-1 size-3" />{j.rating}/5</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent></Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
