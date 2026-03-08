"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Upload, Eye, Shield, Clock } from "lucide-react";

const documents = [
    { id: 1, name: "Mortgage Agreement in Principle", type: "Financial", uploaded: "5 Mar 2026", status: "Verified", size: "2.4 MB" },
    { id: 2, name: "Proof of Address — Utility Bill", type: "Identification", uploaded: "3 Mar 2026", status: "Verified", size: "1.1 MB" },
    { id: 3, name: "Employment Contract", type: "Financial", uploaded: "1 Mar 2026", status: "Pending Review", size: "3.2 MB" },
    { id: 4, name: "Bank Statements (3 months)", type: "Financial", uploaded: "28 Feb 2026", status: "Verified", size: "5.7 MB" },
    { id: 5, name: "Passport Scan", type: "Identification", uploaded: "25 Feb 2026", status: "Verified", size: "890 KB" },
    { id: 6, name: "Solicitor Engagement Letter", type: "Legal", uploaded: "20 Feb 2026", status: "Pending Review", size: "1.8 MB" },
    { id: 7, name: "Home Insurance Quote", type: "Insurance", uploaded: "18 Feb 2026", status: "Expired", size: "640 KB" },
];

export default function DocumentsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Document Vault</h1>
                    <p className="text-muted-foreground">Securely store and manage your property documents</p>
                </div>
                <Button><Upload className="mr-2 size-4" />Upload Document</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Documents</CardDescription>
                        <CardTitle className="text-3xl">7</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Verified</CardDescription>
                        <CardTitle className="text-3xl text-green-600">4</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pending Review</CardDescription>
                        <CardTitle className="text-3xl text-amber-600">2</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Expired</CardDescription>
                        <CardTitle className="text-3xl text-red-600">1</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Tabs defaultValue="all">
                <TabsList>
                    <TabsTrigger value="all">All Documents</TabsTrigger>
                    <TabsTrigger value="financial">Financial</TabsTrigger>
                    <TabsTrigger value="identification">Identification</TabsTrigger>
                    <TabsTrigger value="legal">Legal</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Document</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Uploaded</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="size-4 text-muted-foreground" />
                                                    <span className="font-medium">{doc.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant="outline">{doc.type}</Badge></TableCell>
                                            <TableCell><div className="flex items-center gap-1 text-sm"><Clock className="size-3" />{doc.uploaded}</div></TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{doc.size}</TableCell>
                                            <TableCell>
                                                <Badge variant={doc.status === "Verified" ? "default" : doc.status === "Expired" ? "destructive" : "secondary"}>
                                                    {doc.status === "Verified" && <Shield className="mr-1 size-3" />}
                                                    {doc.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon"><Eye className="size-4" /></Button>
                                                    <Button variant="ghost" size="icon"><Download className="size-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="financial"><Card><CardContent className="py-8 text-center text-muted-foreground">Showing 3 financial documents</CardContent></Card></TabsContent>
                <TabsContent value="identification"><Card><CardContent className="py-8 text-center text-muted-foreground">Showing 2 identification documents</CardContent></Card></TabsContent>
                <TabsContent value="legal"><Card><CardContent className="py-8 text-center text-muted-foreground">Showing 1 legal document</CardContent></Card></TabsContent>
            </Tabs>
        </div>
    );
}
