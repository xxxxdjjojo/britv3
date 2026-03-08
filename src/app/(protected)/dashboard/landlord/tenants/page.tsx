"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Phone, Mail, Home, PoundSterling } from "lucide-react";

const tenants = [
    { id: 1, name: "James & Sarah Miller", property: "2 Bed Flat, Stratford", rent: "£1,750/mo", leaseEnd: "28 Feb 2027", status: "Active", paymentStatus: "Up to date", email: "miller@email.com", phone: "07700 900123" },
    { id: 2, name: "Dr. Aiden Clarke", property: "1 Bed Flat, Angel", rent: "£2,200/mo", leaseEnd: "31 Aug 2026", status: "Active", paymentStatus: "Up to date", email: "clarke@email.com", phone: "07700 900456" },
    { id: 3, name: "Emily Watson", property: "Studio, Bermondsey", rent: "£1,450/mo", leaseEnd: "15 Jun 2026", status: "Notice Given", paymentStatus: "Up to date", email: "watson@email.com", phone: "07700 900789" },
    { id: 4, name: "Michael & Lisa Brown", property: "3 Bed House, Dulwich", rent: "£2,800/mo", leaseEnd: "30 Nov 2026", status: "Active", paymentStatus: "1 month arrears", email: "brown@email.com", phone: "07700 900321" },
];

export default function TenantsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
                    <p className="text-muted-foreground">Manage your current tenants and tenancies</p>
                </div>
                <Button><Users className="mr-2 size-4" />Add Tenant</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card><CardHeader className="pb-2"><CardDescription>Total Tenants</CardDescription><CardTitle className="text-3xl">4</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Active Leases</CardDescription><CardTitle className="text-3xl text-green-600">3</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Monthly Income</CardDescription><CardTitle className="text-2xl">£8,200</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>In Arrears</CardDescription><CardTitle className="text-3xl text-red-600">1</CardTitle></CardHeader></Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tenant</TableHead>
                                <TableHead>Property</TableHead>
                                <TableHead>Rent</TableHead>
                                <TableHead>Lease End</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-8"><AvatarFallback className="text-xs">{t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="font-medium">{t.name}</p>
                                                <p className="text-xs text-muted-foreground">{t.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell><div className="flex items-center gap-1"><Home className="size-3 text-muted-foreground" />{t.property}</div></TableCell>
                                    <TableCell className="font-medium">{t.rent}</TableCell>
                                    <TableCell>{t.leaseEnd}</TableCell>
                                    <TableCell><Badge variant={t.status === "Active" ? "default" : "secondary"}>{t.status}</Badge></TableCell>
                                    <TableCell><Badge variant={t.paymentStatus === "Up to date" ? "outline" : "destructive"}>{t.paymentStatus}</Badge></TableCell>
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
