"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, ThumbsUp, MessageSquare } from "lucide-react";

const reviews = [
    { id: 1, client: "Mrs. Thompson", job: "Full Bathroom Renovation", rating: 5, date: "5 Mar 2026", comment: "Absolutely fantastic work! The bathroom looks incredible. Very professional, tidy, and completed on time. Would highly recommend." },
    { id: 2, client: "Michael Brown", job: "Window Latch Replacement", rating: 5, date: "1 Mar 2026", comment: "Quick, efficient, and reasonably priced. Fixed all three window latches in under an hour." },
    { id: 3, client: "James Miller", job: "Intercom Repair", rating: 4, date: "26 Feb 2026", comment: "Good work on the intercom. Took slightly longer than quoted but the result is excellent." },
    { id: 4, client: "Emily Watson", job: "Damp Treatment Assessment", rating: 5, date: "20 Feb 2026", comment: "Very thorough assessment with clear explanation of the issue and recommended solutions. Professional report provided." },
    { id: 5, client: "Dr. Clarke", job: "Emergency Pipe Repair", rating: 4, date: "15 Feb 2026", comment: "Arrived within 2 hours of calling. Fixed the burst pipe quickly. Fair pricing for emergency call-out." },
    { id: 6, client: "Sarah White", job: "Garden Wall Repointing", rating: 5, date: "10 Feb 2026", comment: "Beautiful job on the garden wall. Attention to detail was impressive. Very happy with the result." },
];

const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

export default function ReviewsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
                <p className="text-muted-foreground">Client reviews and ratings for your services</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card><CardHeader className="pb-2"><CardDescription>Overall Rating</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><Star className="size-6 fill-amber-400 text-amber-400" />{avgRating}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Total Reviews</CardDescription><CardTitle className="text-3xl">{reviews.length}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>5-Star Reviews</CardDescription><CardTitle className="text-3xl text-green-600">{reviews.filter(r => r.rating === 5).length}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Response Rate</CardDescription><CardTitle className="text-3xl">100%</CardTitle></CardHeader></Card>
            </div>

            <div className="space-y-4">
                {reviews.map((review) => (
                    <Card key={review.id}>
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <Avatar><AvatarFallback>{review.client.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{review.client}</p>
                                            <p className="text-sm text-muted-foreground">{review.job}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`size-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`} />
                                                ))}
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">{review.date}</p>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
