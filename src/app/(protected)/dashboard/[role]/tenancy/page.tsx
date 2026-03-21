
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Home, Calendar, PoundSterling, User, FileText, Wrench, Phone, Mail } from "lucide-react";

export default function TenancyPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Current Tenancy</h1>
                <p className="text-muted-foreground">Your active rental agreement details</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>2 Bed Flat, Stratford</CardTitle>
                            <Badge>Active</Badge>
                        </div>
                        <CardDescription>15 Olympic Way, Stratford, London E20 1AB</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex items-center gap-3">
                                <Calendar className="size-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Lease Period</p>
                                    <p className="font-medium">1 Mar 2026 — 28 Feb 2027</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <PoundSterling className="size-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Monthly Rent</p>
                                    <p className="font-medium">£1,750/mo</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Home className="size-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Property Type</p>
                                    <p className="font-medium">2 Bed Flat, Purpose-built</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <PoundSterling className="size-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Deposit Held</p>
                                    <p className="font-medium">£2,625 (DPS Protected)</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="mb-3 font-semibold">Payment History</h3>
                            <div className="space-y-2">
                                {["Mar 2026", "Feb 2026", "Jan 2026"].map((month) => (
                                    <div key={month} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">Rent — {month}</p>
                                            <p className="text-sm text-muted-foreground">Paid via Standing Order</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">£1,750.00</p>
                                            <Badge variant="default" className="text-xs">Paid</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Landlord</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2"><User className="size-4 text-muted-foreground" /><span>Mr. & Mrs. Chen</span></div>
                            <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /><span>020 7946 0123</span></div>
                            <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /><span>chen@email.com</span></div>
                            <Button variant="outline" className="w-full">Message Landlord</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start"><Wrench className="mr-2 size-4" />Report Maintenance</Button>
                            <Button variant="outline" className="w-full justify-start"><FileText className="mr-2 size-4" />View Lease Agreement</Button>
                            <Button variant="outline" className="w-full justify-start"><PoundSterling className="mr-2 size-4" />Payment History</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Important Dates</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Next Rent Due</span><span className="font-medium">1 Apr 2026</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Lease Renewal</span><span className="font-medium">28 Feb 2027</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Annual Gas Check</span><span className="font-medium">15 Jun 2026</span></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
