"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, Archive, FileEdit, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";

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
  const isDraft = status === "draft";

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
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:ring-border">
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Building2 className="size-7" strokeWidth={1} />
            <span className="text-xs">No image</span>
          </div>
        )}
        {/* Status badge */}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
            isDraft
              ? "bg-warning-light text-warning dark:bg-amber-900/20 dark:text-amber-400"
              : "bg-muted/90 text-muted-foreground backdrop-blur-sm",
          )}
        >
          {status}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{title}</p>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestore}
            disabled={restoring}
            className="flex-1 gap-1.5 rounded-lg text-xs font-medium"
          >
            <RotateCcw className={cn("size-3.5", restoring && "animate-spin")} strokeWidth={1.25} />
            {restoring ? "Restoring…" : "Restore"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleting}
                type="button"
                className="flex-1 gap-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" strokeWidth={1.25} />
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading">Delete listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The listing will be permanently deleted from your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                >
                  Delete listing
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ type }: Readonly<{ type: "archived" | "draft" }>) {
  const isDraft = type === "draft";
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl bg-card py-20 text-center shadow-sm ring-1 ring-border/60">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        {isDraft ? (
          <FileEdit className="size-7 text-muted-foreground" strokeWidth={1.25} />
        ) : (
          <Archive className="size-7 text-muted-foreground" strokeWidth={1.25} />
        )}
      </div>
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground">
          No {isDraft ? "draft" : "archived"} listings
        </h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          {isDraft
            ? "Listings you save as drafts will appear here."
            : "Listings you archive will be stored here for future reference."}
        </p>
      </div>
      {isDraft && (
        <Button
          className="gap-2 bg-brand-primary text-white hover:bg-brand-primary-light"
          render={<Link href="/dashboard/agent/listings/create" />}
        >
          <Plus className="size-4" strokeWidth={1.5} />
          Create Listing
        </Button>
      )}
    </div>
  );
}

export function ArchivedDraftListings({ listings }: Props) {
  const [items, setItems] = useState(listings);

  const archived = items.filter((l) => getStr(l, "status") === "archived");
  const drafts = items.filter((l) => getStr(l, "status") === "draft");

  function handleRestored(id: string) {
    setItems((prev) => prev.filter((l) => getStr(l, "id") !== id));
  }

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((l) => getStr(l, "id") !== id));
  }

  function renderGrid(data: Record<string, unknown>[], type: "archived" | "draft") {
    if (data.length === 0) {
      return <EmptyState type={type} />;
    }
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
    <div className="flex flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Listings
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground">
          Archived &amp; Drafts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {archived.length} archived &middot; {drafts.length} draft{drafts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="archived">
        <TabsList className="rounded-xl bg-muted p-1">
          <TabsTrigger
            value="archived"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Archive className="mr-1.5 size-3.5" strokeWidth={1.25} />
            Archived
            <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-xs">
              {archived.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="drafts"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <FileEdit className="mr-1.5 size-3.5" strokeWidth={1.25} />
            Drafts
            <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-xs">
              {drafts.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="archived" className="mt-6">
          {renderGrid(archived, "archived")}
        </TabsContent>
        <TabsContent value="drafts" className="mt-6">
          {renderGrid(drafts, "draft")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
