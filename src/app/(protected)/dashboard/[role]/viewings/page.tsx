"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, User, Video, Plus } from "lucide-react";

const upcomingViewings = [
    { id: 1, property: "4 Bed Detached, Kensington", date: "12 Mar 2026", time: "10:00 AM", agent: "Sarah Mitchell", type: "In Person", status: "Confirmed", address: "42 Holland Park Ave, W11" },
    { id: 2, property: "2 Bed Flat, Canary Wharf", date: "14 Mar 2026", time: "2:30 PM", agent: "James Harper", type: "Virtual", status: "Pending", address: "15 Westferry Circus, E14" },
    { id: 3, property: "3 Bed Semi, Guildford", date: "16 Mar 2026", time: "11:00 AM", agent: "Emma Richards", type: "In Person", status: "Confirmed", address: "8 Epsom Road, GU1" },
];

const pastViewings = [
    { id: 4, property: "5 Bed Victorian, Richmond", date: "5 Mar 2026", time: "3:00 PM", agent: "Oliver Grant", type: "In Person", status: "Completed", feedback: "Loved the garden, concerned about roof" },
    { id: 5, property: "1 Bed Studio, Shoreditch", date: "2 Mar 2026", time: "1:00 PM", agent: "David Chen", type: "Virtual", status: "Completed", feedback: "Too small for our needs" },
    { id: 6, property: "3 Bed Terraced, Wimbledon", date: "28 Feb 2026", time: "10:30 AM", agent: "Sophie Turner", type: "In Person", status: "Cancelled", feedback: "N/A" },
];

export default function ViewingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Viewings</h1>
                    <p className="text-muted-foreground">Manage your property viewings and appointments</p>
                </div>
                <Button><Plus className="mr-2 size-4" />Book Viewing</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Upcoming</CardDescription>
                        <CardTitle className="text-3xl">3</CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-xs text-muted-foreground">Next: 12 Mar 2026</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Completed</CardDescription>
                        <CardTitle className="text-3xl">8</CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-xs text-muted-foreground">This month: 2</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Avg. Feedback Score</CardDescription>
                        <CardTitle className="text-3xl">4.2/5</CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-xs text-muted-foreground">Based on agent ratings</p></CardContent>
                </Card>
            </div>

            <Tabs defaultValue="upcoming">
                <TabsList>
                    <TabsTrigger value="upcoming">Upcoming ({upcomingViewings.length})</TabsTrigger>
                    <TabsTrigger value="past">Past ({pastViewings.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Property</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Agent</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {upcomingViewings.map((v) => (
                                        <TableRow key={v.id}>
                                            <TableCell>
                                                <div className="font-medium">{v.property}</div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{v.address}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1"><Calendar className="size-3" />{v.date}</div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />{v.time}</div>
                                            </TableCell>
                                            <TableCell><div className="flex items-center gap-1"><User className="size-3" />{v.agent}</div></TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{v.type === "Virtual" ? <><Video className="mr-1 size-3" />Virtual</> : "In Person"}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={v.status === "Confirmed" ? "default" : "secondary"}>{v.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm">Reschedule</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="past">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Property</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Agent</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Feedback</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pastViewings.map((v) => (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-medium">{v.property}</TableCell>
                                            <TableCell>{v.date}</TableCell>
                                            <TableCell>{v.agent}</TableCell>
                                            <TableCell><Badge variant={v.status === "Completed" ? "default" : "destructive"}>{v.status}</Badge></TableCell>
                                            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{v.feedback}</TableCell>
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
