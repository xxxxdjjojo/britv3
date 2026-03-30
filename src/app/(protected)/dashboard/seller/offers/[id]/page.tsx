import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle,
  Link2Off,
  MessageSquare,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { OfferActionButtons } from "@/components/seller/offers/OfferActionButtons";
import type { SellerOffer } from "@/types/seller";

export const dynamic = "force-dynamic";

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;

type TimelineEvent = Readonly<{
  id: string;
  kind: "offer" | "counter" | "accept" | "reject" | "message";
  actor: "buyer" | "seller";
  amount: number | null;
  message: string | null;
  occurred_at: string;
}>;

function buildTimeline(offer: SellerOffer): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    id: "initial",
    kind: "offer",
    actor: "buyer",
    amount: offer.amount,
    message: offer.conditions ?? null,
    occurred_at: offer.offered_at,
  });

  if (offer.counter_amount) {
    events.push({
      id: "counter",
      kind: "counter",
      actor: "seller",
      amount: offer.counter_amount,
      message: offer.counter_message ?? null,
      occurred_at: offer.responded_at ?? offer.updated_at,
    });
  }

  if (offer.status === "accepted") {
    events.push({
      id: "accepted",
      kind: "accept",
      actor: "seller",
      amount: offer.counter_amount ?? offer.amount,
      message: null,
      occurred_at: offer.responded_at ?? offer.updated_at,
    });
  }

  if (offer.status === "rejected") {
    events.push({
      id: "rejected",
      kind: "reject",
      actor: "seller",
      amount: null,
      message: null,
      occurred_at: offer.responded_at ?? offer.updated_at,
    });
  }

  return events;
}

function formatGBP(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB")}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type TimelineBubbleProps = Readonly<{
  event: TimelineEvent;
  askingPrice: number | null;
}>;

function TimelineBubble({ event, askingPrice }: TimelineBubbleProps) {
  const isSeller = event.actor === "seller";

  let label = "";
  let labelClass = "";

  if (event.kind === "offer") {
    label = "Offer made";
    labelClass = "text-amber-700";
  } else if (event.kind === "counter") {
    label = "Counter offer";
    labelClass = "text-blue-700";
  } else if (event.kind === "accept") {
    label = "Offer accepted";
    labelClass = "text-emerald-700";
  } else if (event.kind === "reject") {
    label = "Offer rejected";
    labelClass = "text-red-600";
  } else {
    label = "Message";
    labelClass = "text-[#1a1c1c]/60";
  }

  const priceDiff =
    event.amount && askingPrice ? event.amount - askingPrice : null;
  const pricePct =
    priceDiff !== null && askingPrice
      ? ((priceDiff / askingPrice) * 100).toFixed(1)
      : null;
  const aboveAsking = priceDiff !== null && priceDiff > 0;

  return (
    <div className={`flex gap-3 ${isSeller ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${isSeller ? "bg-[#1B4D3E]" : "bg-[#D4A853]"}`}
      >
        {isSeller ? "S" : "B"}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-sm rounded-2xl p-4 ${
          isSeller
            ? "bg-[#1B4D3E]/5 rounded-tr-sm"
            : "bg-[#faf9f8] rounded-tl-sm"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-semibold ${labelClass}`}>{label}</span>
          <span className="text-xs text-[#1a1c1c]/30">
            {isSeller ? "You" : "Buyer"}
          </span>
        </div>

        {event.amount !== null && (
          <div className="mb-2">
            <p className="text-2xl font-bold text-[#1a1c1c]">
              {formatGBP(event.amount)}
            </p>
            {pricePct && (
              <span
                className={`text-xs font-medium flex items-center gap-0.5 mt-0.5 ${aboveAsking ? "text-emerald-600" : "text-red-500"}`}
              >
                {aboveAsking ? (
                  <TrendingUp size={11} />
                ) : (
                  <TrendingDown size={11} />
                )}
                {aboveAsking ? "+" : ""}
                {pricePct}% vs asking
              </span>
            )}
          </div>
        )}

        {event.kind === "accept" && (
          <div className="flex items-center gap-1.5 text-emerald-700 text-sm font-semibold">
            <CheckCircle size={14} />
            Sale agreed
          </div>
        )}

        {event.message && (
          <div className="mt-2 pt-2 border-t border-[#1a1c1c]/5">
            <p className="text-sm text-[#1a1c1c]/70">{event.message}</p>
          </div>
        )}

        <p className="text-xs text-[#1a1c1c]/30 mt-2">
          {formatDateTime(event.occurred_at)}
        </p>
      </div>
    </div>
  );
}

export default async function NegotiationHubPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: offerRaw } = await supabase
    .from("seller_offers")
    .select(
      `
      *,
      listing:listing_id ( id, address_line_1, city, postcode, asking_price, photos )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!offerRaw) redirect("/dashboard/seller/offers");

  const offer = offerRaw as SellerOffer;
  const listing = offer.listing as
    | {
        id: string;
        address_line_1: string | null;
        city: string | null;
        postcode: string | null;
        asking_price: number | null;
        photos: Array<{ url: string }>;
      }
    | null
    | undefined;

  const address = listing
    ? [listing.address_line_1, listing.city].filter(Boolean).join(", ")
    : "Property";

  const askingPrice = listing?.asking_price ?? null;
  const timeline = buildTimeline(offer);
  const isPending = offer.status === "pending";
  const hasProgressed = offer.status === "accepted";

  const statusLabel =
    offer.status === "pending"
      ? "Awaiting your response"
      : offer.status === "accepted"
        ? "Accepted — Sale agreed"
        : offer.status === "countered"
          ? "Counter offer sent"
          : offer.status === "rejected"
            ? "Rejected"
            : "Withdrawn";

  const statusClass =
    offer.status === "pending"
      ? "bg-amber-100 text-amber-700"
      : offer.status === "accepted"
        ? "bg-emerald-100 text-emerald-700"
        : offer.status === "countered"
          ? "bg-blue-100 text-blue-700"
          : "bg-red-100 text-red-600";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/seller/offers"
            className="inline-flex items-center gap-1.5 text-sm text-[#1a1c1c]/50 hover:text-[#1a1c1c] transition-colors mb-2"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
            Offers
          </Link>
          <h1 className="text-2xl font-bold text-[#1a1c1c] tracking-tight">
            Negotiation Hub
          </h1>
          <p className="text-sm text-[#1a1c1c]/60 mt-0.5">{address}</p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Buyer info card */}
      <div className="bg-[#faf9f8] rounded-xl p-5 flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#D4A853]/30 to-[#D4A853]/10 flex items-center justify-center text-[#D4A853] font-bold text-lg flex-shrink-0">
          {offer.buyer_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-[#1a1c1c]">{offer.buyer_name}</p>
            {offer.is_verified && (
              <BadgeCheck size={16} className="text-blue-500" />
            )}
          </div>
          <p className="text-xs text-[#1a1c1c]/50 mt-0.5">{offer.buyer_email}</p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span
              className={`flex items-center gap-1.5 text-xs font-medium ${offer.chain_status === "chain_free" ? "text-emerald-600" : "text-amber-600"}`}
            >
              {offer.chain_status === "chain_free" ? (
                <CheckCircle size={12} />
              ) : (
                <Link2Off size={12} />
              )}
              {offer.chain_status === "chain_free"
                ? "Chain-free"
                : `In chain (${offer.chain_length ?? "?"})`}
            </span>
            {offer.buyer_type && (
              <span className="text-xs text-[#1a1c1c]/50 capitalize">
                {offer.buyer_type} buyer
              </span>
            )}
          </div>
        </div>
        {askingPrice && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-[#1a1c1c]/40 font-medium">Asking</p>
            <p className="text-lg font-bold text-[#1a1c1c]">
              {formatGBP(askingPrice)}
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare size={18} strokeWidth={1.25} className="text-[#1a1c1c]/40" />
          <h2 className="font-semibold text-[#1a1c1c] text-sm">
            Negotiation timeline
          </h2>
        </div>

        <div className="space-y-6">
          {timeline.map((event) => (
            <TimelineBubble
              key={event.id}
              event={event}
              askingPrice={askingPrice}
            />
          ))}
        </div>
      </div>

      {/* Action bar — only when pending */}
      {isPending && (
        <div className="bg-[#faf9f8] rounded-2xl p-5">
          <p className="text-sm font-semibold text-[#1a1c1c] mb-4">
            Respond to this offer
          </p>
          <OfferActionButtons offer={offer} />
        </div>
      )}

      {/* Sale progress CTA */}
      {hasProgressed && (
        <div className="bg-[#1B4D3E] rounded-xl p-5 text-white flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-lg">Sale agreed!</p>
            <p className="text-white/70 text-sm mt-0.5">
              Track the conveyancing process from start to completion
            </p>
          </div>
          <Link
            href={`/dashboard/seller/sale-progress/${offer.id}`}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white text-[#1B4D3E] text-sm font-bold hover:bg-white/90 transition-colors"
          >
            View progress
          </Link>
        </div>
      )}
    </div>
  );
}
