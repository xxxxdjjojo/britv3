"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ViewingBooking } from "@/components/properties/ViewingBooking";
import { QuoteCreateForm } from "@/components/marketplace/QuoteCreateForm";
import { createClient } from "@/lib/supabase/client";

type Props = Readonly<{
  participantName: string;
  contextType: string;
  contextId?: string;
}>;

export default function ConversationQuickActions({
  participantName,
  contextType,
  contextId,
}: Props) {
  const [viewingOpen, setViewingOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [propertyAddress, setPropertyAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  const showQuote = contextType === "rfq";
  const hasRfq = Boolean(contextId);

  // Fetch the listing's property address when context is a listing
  useEffect(() => {
    if (contextType !== "listing" || !contextId) return;

    let cancelled = false;
    setAddressLoading(true);

    const supabase = createClient();
    supabase
      .from("listings")
      .select("properties(address_line1, city, postcode)")
      .eq("id", contextId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        const prop = data?.properties as {
          address_line1: string;
          city: string;
          postcode: string;
        } | null;
        if (prop) {
          setPropertyAddress(
            `${prop.address_line1}, ${prop.city}, ${prop.postcode}`,
          );
        }
        setAddressLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contextType, contextId]);

  const resolvedPropertyAddress =
    contextType === "listing"
      ? addressLoading
        ? "Loading..."
        : (propertyAddress ?? "Property")
      : "Property";

  return (
    <>
      {/* Quick action chips */}
      <div className="flex gap-2 px-4 py-2 border-t overflow-x-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full shrink-0 text-xs gap-1.5"
          onClick={() => setViewingOpen(true)}
        >
          <Calendar className="h-3.5 w-3.5" />
          Schedule Viewing
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full shrink-0 text-xs gap-1.5"
          disabled
          title="Coming soon"
        >
          <FileText className="h-3.5 w-3.5" />
          Send Document
        </Button>
        {showQuote && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full shrink-0 text-xs gap-1.5"
            onClick={() => hasRfq && setQuoteOpen(true)}
            disabled={!hasRfq}
            title={hasRfq ? undefined : "No active service request"}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Send Quote
          </Button>
        )}
      </div>

      {/* Schedule Viewing modal */}
      <Dialog open={viewingOpen} onOpenChange={setViewingOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule a Viewing</DialogTitle>
          </DialogHeader>
          <ViewingBooking
            agentName={participantName}
            propertyAddress={resolvedPropertyAddress}
          />
        </DialogContent>
      </Dialog>

      {/* Send Quote modal */}
      {showQuote && hasRfq && (
        <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Quote</DialogTitle>
            </DialogHeader>
            <QuoteCreateForm
              serviceRequestId={contextId!}
              onSuccess={() => setQuoteOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
