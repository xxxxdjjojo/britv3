"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Calendar,
  Clock,
  History,
  Mail,
  MapPin,
  User,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "enquiries" | "viewings" | "history";

type Enquiry = {
  id: string;
  buyer_name: string;
  buyer_email: string;
  property_title: string;
  property_address: string;
  message: string;
  created_at: string;
  status: "new" | "read" | "replied";
};

type Viewing = {
  id: string;
  buyer_name: string;
  property_title: string;
  property_address: string;
  viewing_datetime: string;
  type: "in_person" | "virtual";
  status: "confirmed" | "pending" | "completed" | "cancelled";
  notes?: string;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function statusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "new":
      return {
        label: "New",
        className: "bg-brand-primary/10 text-brand-primary",
      };
    case "read":
      return {
        label: "Read",
        className: "bg-surface-container-low text-on-surface-variant",
      };
    case "replied":
      return {
        label: "Replied",
        className: "bg-primary-container/20 text-brand-primary",
      };
    case "confirmed":
      return {
        label: "Confirmed",
        className: "bg-primary-container/20 text-brand-primary",
      };
    case "pending":
      return {
        label: "Pending",
        className: "bg-secondary-container/20 text-on-secondary-container",
      };
    case "completed":
      return {
        label: "Completed",
        className: "bg-surface-container-low text-on-surface-variant",
      };
    case "cancelled":
      return { label: "Cancelled", className: "bg-error/10 text-error" };
    default:
      return {
        label: status,
        className: "bg-surface-container-low text-on-surface-variant",
      };
  }
}

const TABS: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
  { key: "enquiries", label: "Enquiries", icon: <MessageSquare className="w-4 h-4" /> },
  { key: "viewings", label: "Viewings", icon: <Calendar className="w-4 h-4" /> },
  { key: "history", label: "History", icon: <History className="w-4 h-4" /> },
];

export default function EnquiriesViewingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("enquiries");
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "enquiries") {
        const res = await fetch("/api/seller/enquiries");
        if (res.ok) setEnquiries(await res.json());
      } else if (activeTab === "viewings") {
        const res = await fetch("/api/seller/viewings?filter=upcoming");
        if (res.ok) {
          const data = await res.json();
          setViewings(
            data.map((v: Record<string, unknown>) => ({
              id: v.id,
              buyer_name: v.buyer_name ?? "Buyer",
              property_title: v.property_title ?? "Property",
              property_address: v.property_address ?? "",
              viewing_datetime: v.viewing_datetime ?? v.scheduled_at,
              type: v.type ?? "in_person",
              status: v.status ?? "pending",
              notes: v.notes,
            })),
          );
        }
      } else {
        // History: load past viewings + replied enquiries
        const [vRes, eRes] = await Promise.all([
          fetch("/api/seller/viewings?filter=past"),
          fetch("/api/seller/enquiries?filter=replied"),
        ]);
        if (vRes.ok) {
          const data = await vRes.json();
          setViewings(
            data.map((v: Record<string, unknown>) => ({
              id: v.id,
              buyer_name: v.buyer_name ?? "Buyer",
              property_title: v.property_title ?? "Property",
              property_address: v.property_address ?? "",
              viewing_datetime: v.viewing_datetime ?? v.scheduled_at,
              type: v.type ?? "in_person",
              status: v.status ?? "completed",
              notes: v.notes,
            })),
          );
        }
        if (eRes.ok) {
          setEnquiries(await eRes.json());
        }
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const newEnquiryCount = enquiries.filter((e) => e.status === "new").length;
  const upcomingViewingCount = viewings.filter(
    (v) => v.status === "confirmed" || v.status === "pending",
  ).length;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-on-surface mb-2">
          Enquiries &amp; Viewings
        </h1>
        <p className="text-on-surface-variant font-sans max-w-2xl">
          Manage all buyer enquiries and property viewings in one place.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-brand-primary" />
            </div>
            <span className="text-2xl font-bold text-on-surface">
              {newEnquiryCount}
            </span>
          </div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
            New Enquiries
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-primary" />
            </div>
            <span className="text-2xl font-bold text-on-surface">
              {upcomingViewingCount}
            </span>
          </div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
            Upcoming Viewings
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <History className="w-5 h-5 text-brand-primary" />
            </div>
            <span className="text-2xl font-bold text-on-surface">
              {enquiries.length + viewings.length}
            </span>
          </div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
            Total Activity
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-outline-variant mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors duration-150",
              activeTab === tab.key
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-xl p-6 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-surface-container-low" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-container-low rounded w-3/4" />
                  <div className="h-3 bg-surface-container-low rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "enquiries" ? (
        enquiries.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-7 h-7 text-outline" />}
            title="No enquiries yet"
            description="When buyers enquire about your properties, they will appear here."
          />
        ) : (
          <div className="space-y-4">
            {enquiries.map((enq) => {
              const badge = statusBadge(enq.status);
              return (
                <div
                  key={enq.id}
                  className={cn(
                    "bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_24px_rgba(26,28,28,0.04)] hover:shadow-[0_8px_32px_rgba(26,28,28,0.08)] transition-all duration-300",
                    enq.status === "new" && "border-l-4 border-brand-primary",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-xs text-outline">
                          {formatDate(enq.created_at)}
                        </span>
                      </div>
                      <h3 className="font-heading text-base font-bold text-on-surface mb-1">
                        {enq.property_title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {enq.buyer_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {enq.buyer_email}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                        {enq.message}
                      </p>
                    </div>
                    <button className="shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-semibold text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors">
                      Reply
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activeTab === "viewings" ? (
        viewings.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-7 h-7 text-outline" />}
            title="No upcoming viewings"
            description="Scheduled viewings for your properties will appear here."
          />
        ) : (
          <div className="space-y-4">
            {viewings.map((v) => {
              const badge = statusBadge(v.status);
              return (
                <div
                  key={v.id}
                  className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_24px_rgba(26,28,28,0.04)] hover:shadow-[0_8px_32px_rgba(26,28,28,0.08)] transition-all duration-300 border-l-4 border-brand-primary"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <h3 className="font-heading text-base font-bold text-on-surface mb-1">
                        {v.property_title}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                        <div>
                          <span className="text-[0.6875rem] font-bold tracking-widest text-outline uppercase block mb-0.5">
                            Date
                          </span>
                          <span className="text-sm font-semibold text-on-surface">
                            {formatDate(v.viewing_datetime)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[0.6875rem] font-bold tracking-widest text-outline uppercase block mb-0.5">
                            Time
                          </span>
                          <span className="text-sm font-semibold text-on-surface">
                            {formatTime(v.viewing_datetime)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[0.6875rem] font-bold tracking-widest text-outline uppercase block mb-0.5">
                            Buyer
                          </span>
                          <span className="text-sm font-semibold text-on-surface flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-outline" />
                            {v.buyer_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[0.6875rem] font-bold tracking-widest text-outline uppercase block mb-0.5">
                            Type
                          </span>
                          <span className="text-sm font-semibold text-on-surface flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-outline" />
                            {v.type === "virtual" ? "Virtual" : "In-person"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* History tab */
        enquiries.length === 0 && viewings.length === 0 ? (
          <EmptyState
            icon={<History className="w-7 h-7 text-outline" />}
            title="No history yet"
            description="Past enquiries and completed viewings will appear here."
          />
        ) : (
          <div className="space-y-4">
            {viewings.map((v) => {
              const badge = statusBadge(v.status);
              return (
                <div
                  key={`v-${v.id}`}
                  className="bg-surface-container-low rounded-xl p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-outline" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading text-sm font-bold text-on-surface truncate">
                          {v.property_title}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase shrink-0 ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Viewing with {v.buyer_name} on{" "}
                        {formatDate(v.viewing_datetime)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {enquiries.map((enq) => {
              const badge = statusBadge(enq.status);
              return (
                <div
                  key={`e-${enq.id}`}
                  className="bg-surface-container-low rounded-xl p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-outline" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading text-sm font-bold text-on-surface truncate">
                          {enq.property_title}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase shrink-0 ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Enquiry from {enq.buyer_name} on{" "}
                        {formatDate(enq.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  description: string;
}>) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface-container-low py-20 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-surface-container">
        {icon}
      </div>
      <div>
        <p className="font-heading font-semibold text-on-surface">{title}</p>
        <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
      </div>
    </div>
  );
}
