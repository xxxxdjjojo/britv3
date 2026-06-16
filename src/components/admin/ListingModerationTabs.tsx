"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminConfirmModal } from "@/components/admin/AdminConfirmModal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminAction } from "@/hooks/useAdminAction";
import type { AdminListing } from "@/services/admin/listing-service";
import { ClipboardList, CheckCircle, Flag } from "lucide-react";
import { toast } from "sonner";

const REJECT_REASONS = [
  "Incomplete information",
  "Suspicious pricing",
  "Duplicate listing",
  "Inappropriate content",
  "Policy violation",
  "Other",
];

const FLAG_REASONS = [
  "Needs review",
  "Suspicious activity",
  "User complaint",
  "Pricing anomaly",
  "Other",
];

type ModalState =
  | { type: "reject"; listingId: string }
  | { type: "flag"; listingId: string }
  | null;

type Props = Readonly<{
  pendingListings: AdminListing[];
  allListings: AdminListing[];
  flaggedListings: AdminListing[];
}>;

function ListingRow({
  listing,
  onApprove,
  onReject,
  onFlag,
  isPending,
}: {
  listing: AdminListing;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onFlag: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <tr className="border-b border-neutral-100 last:border-0">
      <td className="py-3 pr-4">
        <p className="text-sm font-medium text-neutral-900 truncate max-w-xs">
          {listing.title ?? "Untitled"}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">{listing.id.slice(0, 8)}…</p>
      </td>
      <td className="py-3 pr-4">
        <StatusBadge status={listing.status ?? "unknown"} />
      </td>
      <td className="py-3 pr-4 text-sm text-neutral-500">
        {listing.created_at
          ? new Date(listing.created_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—"}
      </td>
      <td className="py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-green-700 border-green-200 hover:bg-green-50 text-xs"
            onClick={() => onApprove(listing.id)}
            disabled={isPending}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-700 border-red-200 hover:bg-red-50 text-xs"
            onClick={() => onReject(listing.id)}
            disabled={isPending}
          >
            Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-amber-700 border-amber-200 hover:bg-amber-50 text-xs"
            onClick={() => onFlag(listing.id)}
            disabled={isPending}
          >
            Flag
          </Button>
        </div>
      </td>
    </tr>
  );
}

function ListingTable({
  listings,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  onApprove,
  onReject,
  onFlag,
  isPending,
}: {
  listings: AdminListing[];
  emptyIcon: import("lucide-react").LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onFlag: (id: string) => void;
  isPending: boolean;
}) {
  if (listings.length === 0) {
    return (
      <AdminEmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Title
            </th>
            <th className="pb-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Status
            </th>
            <th className="pb-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Created
            </th>
            <th className="pb-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              onApprove={onApprove}
              onReject={onReject}
              onFlag={onFlag}
              isPending={isPending}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListingModerationTabs({
  pendingListings,
  allListings,
  flaggedListings,
}: Props) {
  const router = useRouter();
  const { execute, isPending } = useAdminAction();
  const [modal, setModal] = useState<ModalState>(null);

  async function handleApprove(listingId: string) {
    const ok = await execute(`/api/admin/listings/${listingId}/approve`, {
      method: "POST",
    });
    if (ok) toast.success("Listing approved");
  }

  async function handleReject(reason: string) {
    if (!modal || modal.type !== "reject") return;
    const ok = await execute(`/api/admin/listings/${modal.listingId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (ok) {
      toast.success("Listing rejected");
      setModal(null);
      router.refresh();
    }
  }

  async function handleFlag(reason: string) {
    if (!modal || modal.type !== "flag") return;
    const ok = await execute(`/api/admin/listings/${modal.listingId}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (ok) {
      toast.success("Listing flagged");
      setModal(null);
      router.refresh();
    }
  }

  const openReject = (id: string) => setModal({ type: "reject", listingId: id });
  const openFlag = (id: string) => setModal({ type: "flag", listingId: id });

  return (
    <>
      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">
            Pending Review
            {pendingListings.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {pendingListings.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Listings</TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged
            {flaggedListings.length > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {flaggedListings.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <ListingTable
            listings={pendingListings}
            emptyIcon={CheckCircle}
            emptyTitle="No pending listings"
            emptyDescription="All listings have been reviewed."
            onApprove={handleApprove}
            onReject={openReject}
            onFlag={openFlag}
            isPending={isPending}
          />
        </TabsContent>

        <TabsContent value="all">
          <ListingTable
            listings={allListings}
            emptyIcon={ClipboardList}
            emptyTitle="No listings found"
            emptyDescription="There are no property listings on the platform yet."
            onApprove={handleApprove}
            onReject={openReject}
            onFlag={openFlag}
            isPending={isPending}
          />
        </TabsContent>

        <TabsContent value="flagged">
          <ListingTable
            listings={flaggedListings}
            emptyIcon={Flag}
            emptyTitle="No flagged listings"
            emptyDescription="There are no flagged listings awaiting review."
            onApprove={handleApprove}
            onReject={openReject}
            onFlag={openFlag}
            isPending={isPending}
          />
        </TabsContent>
      </Tabs>

      <AdminConfirmModal
        open={modal?.type === "reject"}
        title="Reject Listing"
        description="This listing will be rejected and the owner will be notified."
        reasons={REJECT_REASONS}
        confirmLabel="Reject Listing"
        isLoading={isPending}
        onConfirm={handleReject}
        onCancel={() => setModal(null)}
      />

      <AdminConfirmModal
        open={modal?.type === "flag"}
        title="Flag Listing"
        description="This listing will be flagged for further review."
        reasons={FLAG_REASONS}
        confirmLabel="Flag Listing"
        isLoading={isPending}
        onConfirm={handleFlag}
        onCancel={() => setModal(null)}
      />
    </>
  );
}
