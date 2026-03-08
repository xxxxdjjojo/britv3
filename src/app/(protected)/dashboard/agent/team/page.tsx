"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Mail, Phone, Building, Star } from "lucide-react";

const team = [
    { id: 1, name: "Sarah Mitchell", role: "Senior Negotiator", email: "sarah@britestate.co.uk", phone: "020 7946 0001", activeListings: 8, salesThisMonth: 2, rating: 4.9 },
    { id: 2, name: "James Harper", role: "Sales Negotiator", email: "james@britestate.co.uk", phone: "020 7946 0002", activeListings: 6, salesThisMonth: 1, rating: 4.7 },
    { id: 3, name: "Emma Richards", role: "Lettings Manager", email: "emma@britestate.co.uk", phone: "020 7946 0003", activeListings: 12, salesThisMonth: 3, rating: 4.8 },
    { id: 4, name: "David Chen", role: "Junior Negotiator", email: "david@britestate.co.uk", phone: "020 7946 0004", activeListings: 4, salesThisMonth: 0, rating: 4.5 },
    { id: 5, name: "Sophie Turner", role: "Valuation Specialist", email: "sophie@britestate.co.uk", phone: "020 7946 0005", activeListings: 5, salesThisMonth: 1, rating: 4.6 },
    { id: 6, name: "Oliver Grant", role: "Branch Manager", email: "oliver@britestate.co.uk", phone: "020 7946 0006", activeListings: 3, salesThisMonth: 1, rating: 4.9 },
];

export default function TeamPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground">Manage your branch team and performance</p>
                </div>
                <Button><UserPlus className="mr-2 size-4" />Add Team Member</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card><CardHeader className="pb-2"><CardDescription>Team Size</CardDescription><CardTitle className="text-3xl">{team.length}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Total Listings</CardDescription><CardTitle className="text-3xl">{team.reduce((s, t) => s + t.activeListings, 0)}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Sales This Month</CardDescription><CardTitle className="text-3xl text-green-600">{team.reduce((s, t) => s + t.salesThisMonth, 0)}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Avg. Rating</CardDescription><CardTitle className="text-3xl">{(team.reduce((s, t) => s + t.rating, 0) / team.length).toFixed(1)}</CardTitle></CardHeader></Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Team Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Active Listings</TableHead>
                                <TableHead>Sales (Mar)</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {team.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-8"><AvatarFallback className="text-xs">{m.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="font-medium">{m.name}</p>
                                                <p className="text-xs text-muted-foreground">{m.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{m.role}</Badge></TableCell>
                                    <TableCell className="font-medium">{m.activeListings}</TableCell>
                                    <TableCell>{m.salesThisMonth}</TableCell>
                                    <TableCell><div className="flex items-center gap-1"><Star className="size-3 fill-amber-400 text-amber-400" />{m.rating}</div></TableCell>
                                    <TableCell className="text-right"><Button variant="outline" size="sm">View Profile</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
