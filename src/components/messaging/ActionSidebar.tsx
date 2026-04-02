"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ContextType } from "@/types/messaging";

type ActionSidebarProps = Readonly<{
  conversationId: string;
  contextType: ContextType;
  contextId: string | null;
  participantName: string | null;
}>;

type PropertyData = {
  square_footage: number | null;
  epc_rating: string | null;
  tenure: string | null;
  price: number | null;
  latitude: number | null;
  longitude: number | null;
};

type ViewingData = {
  date: string;
  start_time: string;
  end_time: string;
  label: string;
};

function SectionHeader(props: Readonly<{ children: React.ReactNode }>) {
  return (
    <h5 className="font-label text-[10px] font-bold tracking-widest text-outline uppercase mb-4">
      {props.children}
    </h5>
  );
}

function PropertyFacts(props: Readonly<{ property: PropertyData }>) {
  const { property } = props;
  const facts = [
    { label: "Square Footage", value: property.square_footage ? `${property.square_footage.toLocaleString()} sq ft` : null },
    { label: "Tenure", value: property.tenure },
  ].filter((f) => f.value);

  return (
    <section>
      <SectionHeader>Property Facts</SectionHeader>
      <div className="space-y-4">
        {facts.map((fact) => (
          <div key={fact.label} className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant">{fact.label}</span>
            <span className="text-xs font-bold text-brand-primary">{fact.value}</span>
          </div>
        ))}
        {property.epc_rating && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant">EPC Rating</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
              {property.epc_rating}
            </span>
          </div>
        )}
        {property.price && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant">Price</span>
            <span className="text-xs font-bold text-brand-secondary">
              {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(property.price)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function ScheduledViewing(props: Readonly<{ viewing: ViewingData }>) {
  const { viewing } = props;
  const date = new Date(viewing.date);
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  const day = date.getDate();

  return (
    <section>
      <SectionHeader>Scheduled Viewing</SectionHeader>
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-secondary/10 flex flex-col items-center justify-center text-brand-secondary">
            <span className="text-[8px] font-bold uppercase">{month}</span>
            <span className="text-sm font-extrabold">{day}</span>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider text-outline uppercase">{viewing.label}</div>
            <div className="text-xs font-bold text-brand-primary">
              {viewing.start_time} — {viewing.end_time}
            </div>
          </div>
        </div>
        <button className="w-full py-2.5 text-[10px] font-bold tracking-widest uppercase text-brand-secondary border border-secondary-fixed-dim rounded-lg hover:bg-secondary-container/10 transition-colors">
          Reschedule
        </button>
      </div>
    </section>
  );
}

function EngagementStats(props: Readonly<{ views: number; offers: number }>) {
  return (
    <section>
      <SectionHeader>Engagement</SectionHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-surface-container-high rounded-xl text-center">
          <div className="text-lg font-extrabold text-brand-primary">{props.views}</div>
          <div className="text-[9px] font-bold text-outline uppercase">Views</div>
        </div>
        <div className="p-3 bg-surface-container-high rounded-xl text-center">
          <div className="text-lg font-extrabold text-brand-primary">{props.offers}</div>
          <div className="text-[9px] font-bold text-outline uppercase">Offers</div>
        </div>
      </div>
    </section>
  );
}

function LocationPlaceholder() {
  return (
    <section>
      <SectionHeader>Location</SectionHeader>
      <div className="w-full aspect-square rounded-xl bg-surface-container-highest overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="h-8 w-8 text-brand-primary" fill="currentColor" strokeWidth={0} />
        </div>
      </div>
    </section>
  );
}

function ContactCard(props: Readonly<{ name: string | null }>) {
  const displayName = props.name ?? "Contact";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section>
      <SectionHeader>Contact</SectionHeader>
      <div className="flex flex-col items-center gap-3 py-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary-container text-on-primary-container text-lg font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <p className="font-heading text-sm font-bold text-on-surface">{displayName}</p>
      </div>
    </section>
  );
}

export default function ActionSidebar({
  conversationId,
  contextType,
  contextId,
  participantName,
}: ActionSidebarProps) {
  const isListing = contextType === "listing" && Boolean(contextId);

  const { data: propertyData, isLoading: propertyLoading, isError: propertyError } = useQuery({
    queryKey: ["action-sidebar-property", contextId],
    queryFn: async () => {
      const supabase = createClient();
      const { data: listing } = await supabase
        .from("listings")
        .select("price, properties(square_footage, epc_rating, tenure)")
        .eq("id", contextId!)
        .single();

      if (!listing?.properties) return null;
      const props = listing.properties as unknown as Omit<PropertyData, "price" | "latitude" | "longitude">;
      return { ...props, price: listing.price ? Number(listing.price) : null, latitude: null, longitude: null } as PropertyData;
    },
    enabled: isListing,
    staleTime: 60_000,
  });

  const { data: viewingData } = useQuery({
    queryKey: ["action-sidebar-viewing", contextId],
    queryFn: async () => {
      const supabase = createClient();
      const { data: viewings } = await supabase
        .from("viewings")
        .select("id, viewing_slots(date, start_time, end_time)")
        .eq("listing_id", contextId!)
        .gte("viewing_slots.date", new Date().toISOString().split("T")[0])
        .order("viewing_slots(date)", { ascending: true })
        .limit(1);

      if (!viewings?.length) return null;
      const slot = (viewings[0] as Record<string, unknown>).viewing_slots as Record<string, string> | null;
      if (!slot) return null;
      return {
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        label: "Upcoming Viewing",
      } as ViewingData;
    },
    enabled: isListing,
    staleTime: 60_000,
  });

  const { data: engagementData } = useQuery({
    queryKey: ["action-sidebar-engagement", contextId],
    queryFn: async () => {
      const supabase = createClient();

      const [viewsResult, offersResult] = await Promise.all([
        supabase
          .from("listing_analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("listing_id", contextId!)
          .eq("event_type", "view"),
        supabase
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("listing_id", contextId!),
      ]);

      return {
        views: viewsResult.count ?? 0,
        offers: offersResult.count ?? 0,
      };
    },
    enabled: isListing,
    staleTime: 60_000,
  });

  return (
    <div
      className="w-72 bg-surface-container-low border-l border-transparent hidden lg:flex flex-col overflow-y-auto"
      role="complementary"
      aria-label="Conversation context"
    >
      <div className="p-6 space-y-8">
        {isListing && propertyLoading && (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-2.5 w-24 rounded bg-surface-container" />
                <div className="h-16 w-full rounded-xl bg-surface-container" />
              </div>
            ))}
          </div>
        )}
        {isListing && propertyError && (
          <div className="text-center py-8">
            <p className="text-xs text-outline">Unable to load property data</p>
          </div>
        )}
        {isListing && !propertyLoading && !propertyError && propertyData ? (
          <>
            <PropertyFacts property={propertyData} />
            {viewingData && <ScheduledViewing viewing={viewingData} />}
            {engagementData && (
              <EngagementStats views={engagementData.views} offers={engagementData.offers} />
            )}
            <LocationPlaceholder />
          </>
        ) : !isListing ? (
          <ContactCard name={participantName} />
        ) : null}
      </div>
    </div>
  );
}
