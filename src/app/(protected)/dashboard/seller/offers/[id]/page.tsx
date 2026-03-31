import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle,
  Link2Off,
  TrendingDown,
  TrendingUp,
  FileText,
  Download,
  Eye,
  Phone,
  Send,
  ChevronRight,
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

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type TimelineItemProps = Readonly<{
  event: TimelineEvent;
  askingPrice: number | null;
  isLatest: boolean;
}>;

function TimelineItem({ event, askingPrice, isLatest }: TimelineItemProps) {
  let label = "";
  if (event.kind === "offer") label = "Initial Offer Submitted";
  else if (event.kind === "counter") label = "Counter-offer Received";
  else if (event.kind === "accept") label = "Offer Accepted";
  else if (event.kind === "reject") label = "Offer Rejected";
  else label = "Message";

  const priceDiff =
    event.amount && askingPrice ? event.amount - askingPrice : null;
  const pricePct =
    priceDiff !== null && askingPrice
      ? ((priceDiff / askingPrice) * 100).toFixed(1)
      : null;
  const aboveAsking = priceDiff !== null && priceDiff > 0;

  return (
    <div className="relative">
      <div
        className={`absolute -left-8 w-6 h-6 rounded-full border-4 border-white ${
          isLatest ? "bg-emerald-900" : "bg-stone-200"
        }`}
      />
      <div className="flex justify-between items-start">
        <div>
          <p
            className={`font-['Plus_Jakarta_Sans'] text-sm font-bold ${
              isLatest ? "text-emerald-900" : "text-stone-500"
            }`}
          >
            {label}
          </p>
          {event.amount && (
            <div className="flex items-center gap-2 mt-1">
              <p
                className={`text-lg font-bold ${isLatest ? "text-stone-900" : "text-stone-400"}`}
              >
                {formatGBP(event.amount)}
              </p>
              {pricePct && (
                <span
                  className={`text-xs font-medium flex items-center gap-0.5 ${aboveAsking ? "text-emerald-600" : "text-red-500"}`}
                >
                  {aboveAsking ? (
                    <TrendingUp size={11} strokeWidth={1.25} />
                  ) : (
                    <TrendingDown size={11} strokeWidth={1.25} />
                  )}
                  {aboveAsking ? "+" : ""}
                  {pricePct}% vs asking
                </span>
              )}
            </div>
          )}
          {event.message && (
            <p className="text-stone-400 text-xs mt-1 italic">
              &ldquo;{event.message}&rdquo;
            </p>
          )}
          {event.kind === "accept" && (
            <div className="flex items-center gap-1.5 text-emerald-700 text-sm font-semibold mt-1">
              <CheckCircle size={14} strokeWidth={1.25} />
              Sale agreed
            </div>
          )}
        </div>
        <span className="font-['Inter'] text-[10px] text-stone-400 uppercase tracking-tighter flex-shrink-0 ml-4">
          {formatDateShort(event.occurred_at)}
        </span>
      </div>
    </div>
  );
}

// Document items (static examples — extended when real docs exist)
const EXAMPLE_DOCS = [
  { name: "Identity Verification", status: "Verified", size: "2.4 MB" },
  { name: "Structural Survey Report", status: "Shared", size: "18.1 MB" },
  { name: "Draft Contract v4", status: "Awaiting Signature", size: "1.2 MB" },
];

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
      ? "Pending Confirmation"
      : offer.status === "accepted"
        ? "Accepted — Sale Agreed"
        : offer.status === "countered"
          ? "Counter Offer Sent"
          : offer.status === "rejected"
            ? "Rejected"
            : "Withdrawn";

  // Financial summary
  const offerAmount = offer.amount / 100;
  const deposit = Math.round(offerAmount * 0.1);
  const stampDuty = offerAmount > 925000 ? Math.round(offerAmount * 0.05) : 0;
  const totalAllocation = offerAmount + deposit + stampDuty;

  return (
    <div className="space-y-0">
      {/* Page Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 text-stone-400 mb-3">
          <Link
            href="/dashboard/seller/offers"
            className="flex items-center gap-2 hover:text-emerald-900 transition-colors"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
            <span className="text-[11px] font-bold uppercase tracking-[0.05em]">
              Back to Offers
            </span>
          </Link>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tighter text-emerald-900 leading-none">
              {address}
            </h1>
            <p className="text-stone-400 text-sm mt-2">
              Offer #{id.slice(0, 8).toUpperCase()} ·{" "}
              {offer.buyer_name}
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              type="button"
              className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-[0.05em] hover:bg-stone-50 transition-all"
            >
              Withdraw Offer
            </button>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-10">
        {/* Left / center column — 8 cols */}
        <div className="col-span-12 lg:col-span-8 space-y-10">
          {/* Current Status Card */}
          <section className="bg-white p-8 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-right">
              <span className="font-['Inter'] text-[10px] text-stone-400 uppercase tracking-widest block mb-1">
                Status
              </span>
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${
                  offer.status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : offer.status === "accepted"
                      ? "bg-emerald-100 text-emerald-700"
                      : offer.status === "countered"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-600"
                }`}
              >
                {statusLabel}
              </span>
            </div>

            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-amber-500" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <p className="font-['Plus_Jakarta_Sans'] font-bold text-stone-800 text-base">
                    {offer.buyer_name}
                  </p>
                  {offer.is_verified && (
                    <BadgeCheck size={16} className="text-blue-500" />
                  )}
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${
                      offer.chain_status === "chain_free"
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {offer.chain_status === "chain_free" ? (
                      <CheckCircle size={12} strokeWidth={1.25} />
                    ) : (
                      <Link2Off size={12} strokeWidth={1.25} />
                    )}
                    {offer.chain_status === "chain_free"
                      ? "Chain-free"
                      : `In chain (${offer.chain_length ?? "?"})`}
                  </span>
                </div>
                <p className="font-['Plus_Jakarta_Sans'] text-5xl font-extrabold text-emerald-900 tracking-tighter leading-none">
                  {formatGBP(offer.amount)}
                </p>
                {askingPrice && (
                  <p className="text-stone-400 mt-2 text-sm">
                    Asking price:{" "}
                    <span className="font-semibold text-stone-600">
                      {formatGBP(askingPrice)}
                    </span>
                  </p>
                )}
                {offer.conditions && (
                  <p className="text-stone-400 text-sm mt-2 leading-relaxed max-w-md">
                    {offer.conditions}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Interaction History */}
          <section>
            <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-emerald-900 mb-8 tracking-tight">
              Interaction History
            </h3>
            <div className="relative pl-8 space-y-10">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-stone-200" />
              {[...timeline].reverse().map((event, idx) => (
                <TimelineItem
                  key={event.id}
                  event={event}
                  askingPrice={askingPrice}
                  isLatest={idx === 0}
                />
              ))}
            </div>
          </section>

          {/* Document Vault */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-emerald-900 tracking-tight">
                Document Vault
              </h3>
              <button
                type="button"
                className="text-emerald-900 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 hover:underline"
              >
                <span className="text-base leading-none">+</span> Upload New
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXAMPLE_DOCS.map((doc) => (
                <div
                  key={doc.name}
                  className="group bg-stone-50 p-5 rounded-xl flex items-center justify-between hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-emerald-900 shadow-sm">
                      <FileText size={18} strokeWidth={1.25} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                        {doc.status} · {doc.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye
                      size={18}
                      className="text-stone-400 hover:text-emerald-900 cursor-pointer"
                      strokeWidth={1.25}
                    />
                    <Download
                      size={18}
                      className="text-stone-400 hover:text-emerald-900 cursor-pointer"
                      strokeWidth={1.25}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Action bar — only when pending */}
          {isPending && (
            <section className="bg-stone-50 rounded-2xl p-6">
              <p className="text-sm font-bold text-stone-800 mb-4">
                Respond to this offer
              </p>
              <OfferActionButtons offer={offer} />
            </section>
          )}

          {/* Sale progress CTA */}
          {hasProgressed && (
            <section className="bg-emerald-900 rounded-2xl p-6 text-white flex items-center justify-between gap-4">
              <div>
                <p className="font-['Plus_Jakarta_Sans'] font-bold text-xl">
                  Sale agreed!
                </p>
                <p className="text-white/70 text-sm mt-1">
                  Track the conveyancing process from start to completion
                </p>
              </div>
              <Link
                href={`/dashboard/seller/sale-progress/${offer.id}`}
                className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white text-emerald-900 text-sm font-bold hover:bg-white/90 transition-colors"
              >
                View progress
              </Link>
            </section>
          )}
        </div>

        {/* Right sidebar — 4 cols */}
        <aside className="col-span-12 lg:col-span-4 space-y-8">
          {/* Buyer info card */}
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-emerald-900 mb-4">
              Buyer Details
            </h4>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg flex-shrink-0">
                {offer.buyer_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-stone-900">{offer.buyer_name}</p>
                  {offer.is_verified && (
                    <BadgeCheck size={14} className="text-blue-500" />
                  )}
                </div>
                {offer.buyer_email && (
                  <p className="text-xs text-stone-400">{offer.buyer_email}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-stone-100">
                <span className="text-xs text-stone-400">Buyer type</span>
                <span className="text-xs font-semibold text-stone-700 capitalize">
                  {offer.buyer_type ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-stone-400">Chain status</span>
                <span
                  className={`text-xs font-semibold ${
                    offer.chain_status === "chain_free"
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {offer.chain_status === "chain_free"
                    ? "Chain-free"
                    : `In chain (${offer.chain_length ?? "?"})`}
                </span>
              </div>
            </div>
          </section>

          {/* Financial Summary */}
          <section className="bg-emerald-900 text-white p-8 rounded-2xl space-y-5">
            <h4 className="font-['Plus_Jakarta_Sans'] text-lg font-bold tracking-tight">
              Financial Summary
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Offer Price</span>
                <span className="font-bold">{formatGBP(offer.amount)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Deposit (10%)</span>
                <span className="font-bold">
                  £{deposit.toLocaleString("en-GB")}
                </span>
              </div>
              {stampDuty > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/60">Stamp Duty (Est.)</span>
                  <span className="font-bold">
                    £{stampDuty.toLocaleString("en-GB")}
                  </span>
                </div>
              )}
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-sm font-bold">Total Allocation</span>
                <span className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-amber-300">
                  £{totalAllocation.toLocaleString("en-GB")}
                </span>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="space-y-2">
            <h4 className="font-['Inter'] text-[10px] text-stone-400 uppercase tracking-widest px-1">
              Quick Actions
            </h4>
            {[
              { icon: Phone, label: "Request Callback" },
              { icon: Send, label: "Message Buyer" },
              { icon: FileText, label: "Download Summary" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                className="w-full flex items-center justify-between p-4 bg-white border border-stone-200/50 rounded-xl hover:border-emerald-200 transition-all text-sm group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className="text-emerald-900 group-hover:scale-110 transition-transform"
                    strokeWidth={1.25}
                  />
                  <span className="font-medium text-stone-700">{label}</span>
                </div>
                <ChevronRight
                  size={16}
                  className="text-stone-300"
                  strokeWidth={1.25}
                />
              </button>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}
