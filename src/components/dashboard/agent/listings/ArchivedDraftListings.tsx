"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, RotateCcw, Trash2 } from "lucide-react";

export function ArchivedDraftListings(
  props: Readonly<{
    archivedListings: Record<string, unknown>[];
    draftListings: Record<string, unknown>[];
  }>,
) {
  const [tab, setTab] = useState("archived");
  const [archived, setArchived] = useState(props.archivedListings);
  const [drafts, setDrafts] = useState(props.draftListings);
  const [loading, setLoading] = useState<string | null>(null);

  const handleRestore = useCallback(async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch("/api/agent/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "restore" }),
      });
      if (res.ok) {
        setArchived((prev) => prev.filter((l) => String(l.id) !== id));
      }
    } finally {
      setLoading(null);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing? This cannot be undone.",
    );
    if (!confirmed) return;

    setLoading(id);
    try {
      const res = await fetch("/api/agent/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "archive" }),
      });
      if (res.ok) {
        setDrafts((prev) => prev.filter((l) => String(l.id) !== id));
      }
    } finally {
      setLoading(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Archived & Drafts
        </h1>
        <p className="text-muted-foreground">
          Manage archived and draft listings
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="archived">
            Archived ({archived.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Drafts ({drafts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="archived" className="mt-4">
          {archived.length === 0 ? (
            <EmptyState label="archived" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {archived.map((listing) => {
                const id = String(listing.id ?? "");
                return (
                  <ListingCard
                    key={id}
                    listing={listing}
                    loading={loading === id}
                    actions={
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading === id}
                        onClick={() => handleRestore(id)}
                      >
                        <RotateCcw className="mr-1 size-3" />
                        Restore
                      </Button>
                    }
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="draft" className="mt-4">
          {drafts.length === 0 ? (
            <EmptyState label="draft" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {drafts.map((listing) => {
                const id = String(listing.id ?? "");
                return (
                  <ListingCard
                    key={id}
                    listing={listing}
                    loading={loading === id}
                    actions={
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loading === id}
                          onClick={() => handleRestore(id)}
                        >
                          <RotateCcw className="mr-1 size-3" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={loading === id}
                          onClick={() => handleDelete(id)}
                        >
                          <Trash2 className="mr-1 size-3" />
                          Delete
                        </Button>
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ListingCard(
  props: Readonly<{
    listing: Record<string, unknown>;
    loading: boolean;
    actions: React.ReactNode;
  }>,
) {
  const { listing } = props;
  const address = String(listing.address_line_1 ?? listing.title ?? "Untitled");
  const city = listing.city ? `, ${String(listing.city)}` : "";
  const status = String(listing.status ?? "archived");

  return (
    <Card className={props.loading ? "opacity-60" : ""}>
      <div className="flex h-32 items-center justify-center rounded-t-lg bg-muted">
        <Home className="size-8 text-muted-foreground" />
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold">
            {address}
            {city}
          </p>
          <Badge variant="outline" className="shrink-0 capitalize">
            {status}
          </Badge>
        </div>
        {props.actions}
      </CardContent>
    </Card>
  );
}

function EmptyState(props: Readonly<{ label: string }>) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Home className="mb-4 size-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No {props.label} listings</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {props.label === "archived"
            ? "Archived listings will appear here."
            : "Draft listings will appear here."}
        </p>
      </CardContent>
    </Card>
  );
}
