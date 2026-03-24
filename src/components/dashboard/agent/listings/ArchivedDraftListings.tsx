"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

type Props = Readonly<{
  listings: Record<string, unknown>[];
}>;

function getStr(listing: Record<string, unknown>, key: string): string {
  const v = listing[key];
  return typeof v === "string" ? v : "";
}

type ListingCardProps = {
  listing: Record<string, unknown>;
  onRestored: (id: string) => void;
  onDeleted: (id: string) => void;
};

function ListingCard({ listing, onRestored, onDeleted }: ListingCardProps) {
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const id = getStr(listing, "id");
  const title = getStr(listing, "title") || getStr(listing, "address_line_1") || "Untitled";
  const imageUrl = getStr(listing, "primary_image_url");
  const status = getStr(listing, "status");

  async function handleRestore() {
    setRestoring(true);
    try {
      const res = await fetch(`/api/agent/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      if (!res.ok) throw new Error("Restore failed");
      toast.success("Listing restored to draft.");
      onRestored(id);
    } catch {
      toast.error("Could not restore listing. Please try again.");
    } finally {
      setRestoring(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/agent/listings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Listing deleted.");
      onDeleted(id);
    } catch {
      toast.error("Could not delete listing. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
        {status && (
          <span className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-xs font-medium px-2 py-1 rounded-full uppercase">
            {status}
          </span>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <p className="font-medium text-sm line-clamp-2">{title}</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestore}
            disabled={restoring}
          >
            {restoring ? "Restoring..." : "Restore"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger>
              <Button variant="destructive" size="sm" disabled={deleting} type="button">
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The listing will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export function ArchivedDraftListings({ listings }: Props) {
  const [items, setItems] = useState(listings);

  const archived = items.filter(
    (l) => getStr(l, "status") === "archived",
  );
  const drafts = items.filter((l) => getStr(l, "status") === "draft");

  function handleRestored(id: string) {
    setItems((prev) => prev.filter((l) => getStr(l, "id") !== id));
  }

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((l) => getStr(l, "id") !== id));
  }

  function renderGrid(data: Record<string, unknown>[]) {
    if (data.length === 0) {
      return (
        <p className="text-muted-foreground text-sm py-4">No listings found.</p>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((listing) => (
          <ListingCard
            key={getStr(listing, "id")}
            listing={listing}
            onRestored={handleRestored}
            onDeleted={handleDeleted}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">
        Archived & Draft Listings
      </h1>
      <Tabs defaultValue="archived">
        <TabsList>
          <TabsTrigger value="archived">
            Archived ({archived.length})
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts ({drafts.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="archived" className="mt-4">
          {renderGrid(archived)}
        </TabsContent>
        <TabsContent value="drafts" className="mt-4">
          {renderGrid(drafts)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
