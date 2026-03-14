"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Home, RotateCcw, Trash2, FileEdit } from "lucide-react";
import Link from "next/link";

type Listing = {
  id: string;
  title?: string | null;
  address_line_1?: string | null;
  city?: string | null;
  postcode?: string | null;
  price?: number | null;
  status?: string | null;
  property_type?: string | null;
  bedrooms?: number | null;
  created_at: string;
};

function formatPrice(pence: number | null | undefined): string {
  if (pence == null) return "POA";
  const pounds = pence / 100;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pounds);
}

function getAddress(listing: Listing): string {
  const parts = [listing.address_line_1, listing.city, listing.postcode].filter(Boolean);
  return parts.join(", ") || "Address not provided";
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

type ListingCardProps = {
  listing: Listing;
  onRestore: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isRestoring: boolean;
  isDeleting: boolean;
};

function ListingCard({ listing, onRestore, onDelete, isRestoring, isDeleting }: ListingCardProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{getAddress(listing)}</p>
              <Badge variant="outline" className="capitalize text-xs shrink-0">
                {listing.status ?? "archived"}
              </Badge>
            </div>
            {listing.title && (
              <p className="text-sm text-muted-foreground">{listing.title}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {listing.property_type
                ? `${listing.bedrooms ? `${listing.bedrooms} bed ` : ""}${listing.property_type}`
                : "Property"}
              {" · "}Added {formatDate(listing.created_at)}
            </p>
          </div>

          <p className="font-bold text-lg shrink-0">{formatPrice(listing.price)}</p>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRestore(listing.id)}
            disabled={isRestoring || isDeleting}
          >
            <RotateCcw className="mr-1 size-3" />
            Restore to Draft
          </Button>

          {listing.status === "draft" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/agent/listings/create?edit=${listing.id}`}>
                <FileEdit className="mr-1 size-3" />
                Edit
              </Link>
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger
              disabled={isRestoring || isDeleting}
              className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-destructive/30 bg-background px-2.5 text-[0.8rem] font-medium text-destructive transition-all hover:border-destructive hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              <Trash2 className="size-3" />
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &ldquo;{getAddress(listing)}&rdquo;. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(listing.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

type Props = Readonly<{
  archivedListings: Record<string, unknown>[];
  draftListings: Record<string, unknown>[];
}>;

export function ArchivedDraftListings({ archivedListings, draftListings }: Props) {
  const router = useRouter();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const archived = archivedListings as unknown as Listing[];
  const drafts = draftListings as unknown as Listing[];

  async function handleRestore(id: string) {
    setRestoringId(id);
    try {
      await fetch(`/api/agent/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      router.refresh();
    } finally {
      setRestoringId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/agent/listings/${id}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Tabs defaultValue="archived">
      <TabsList>
        <TabsTrigger value="archived">Archived ({archived.length})</TabsTrigger>
        <TabsTrigger value="draft">Draft ({drafts.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="archived" className="mt-4 space-y-3">
        {archived.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="size-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No archived listings.</p>
            </CardContent>
          </Card>
        ) : (
          archived.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onRestore={handleRestore}
              onDelete={handleDelete}
              isRestoring={restoringId === listing.id}
              isDeleting={deletingId === listing.id}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="draft" className="mt-4 space-y-3">
        {drafts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="size-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No draft listings.</p>
            </CardContent>
          </Card>
        ) : (
          drafts.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onRestore={handleRestore}
              onDelete={handleDelete}
              isRestoring={restoringId === listing.id}
              isDeleting={deletingId === listing.id}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
