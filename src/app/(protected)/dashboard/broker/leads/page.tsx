"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Phone,
  Mail,
  Clock,
  PoundSterling,
} from "lucide-react";

type LeadStatus = "new" | "contacted" | "qualified" | "lost";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  enquiryType: string;
  propertyValue: number;
  date: string;
  status: LeadStatus;
  message: string;
};

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-50 text-blue-700 border-blue-200" },
  contacted: { label: "Contacted", color: "bg-amber-50 text-amber-700 border-amber-200" },
  qualified: { label: "Qualified", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  lost: { label: "Lost", color: "bg-muted text-neutral-500 border-border" },
};

const MOCK_LEADS: Lead[] = [
  {
    id: "1",
    name: "Sarah Thompson",
    email: "sarah.t@email.com",
    phone: "07700 900123",
    enquiryType: "First-time buyer",
    propertyValue: 425000,
    date: "2026-03-17",
    status: "new",
    message: "Looking to buy my first property in South London. Combined income of 85k.",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "m.chen@email.com",
    phone: "07700 900456",
    enquiryType: "Remortgage",
    propertyValue: 550000,
    date: "2026-03-16",
    status: "new",
    message: "Current deal expiring in June. Looking for the best rate.",
  },
  {
    id: "3",
    name: "James Reed",
    email: "james.reed@email.com",
    phone: "07700 900789",
    enquiryType: "First-time buyer",
    propertyValue: 375000,
    date: "2026-03-15",
    status: "contacted",
    message: "Joint application. Looking at properties in Kent.",
  },
  {
    id: "4",
    name: "Priya Patel",
    email: "priya.p@email.com",
    phone: "07700 900012",
    enquiryType: "Buy-to-let",
    propertyValue: 280000,
    date: "2026-03-14",
    status: "qualified",
    message: "Existing landlord, adding to portfolio. Has 25% deposit.",
  },
  {
    id: "5",
    name: "David Collins",
    email: "d.collins@email.com",
    phone: "07700 900345",
    enquiryType: "Remortgage",
    propertyValue: 620000,
    date: "2026-03-12",
    status: "contacted",
    message: "Self-employed, 3 years accounts available. Current rate 5.2%.",
  },
  {
    id: "6",
    name: "Lucy Williams",
    email: "lucy.w@email.com",
    phone: "07700 900678",
    enquiryType: "First-time buyer",
    propertyValue: 300000,
    date: "2026-03-10",
    status: "lost",
    message: "Was interested but decided to wait another year.",
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = MOCK_LEADS.filter((lead) => {
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !lead.name.toLowerCase().includes(q) &&
        !lead.enquiryType.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const counts = {
    all: MOCK_LEADS.length,
    new: MOCK_LEADS.filter((l) => l.status === "new").length,
    contacted: MOCK_LEADS.filter((l) => l.status === "contacted").length,
    qualified: MOCK_LEADS.filter((l) => l.status === "qualified").length,
    lost: MOCK_LEADS.filter((l) => l.status === "lost").length,
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-primary-dark">Leads</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage incoming mortgage enquiries and convert them into clients.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "new", "contacted", "qualified", "lost"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={
              statusFilter === status
                ? "rounded-full bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white"
                : "rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-muted"
            }
          >
            {status === "all" ? "All" : STATUS_CONFIG[status].label} ({counts[status]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
        <Input
          placeholder="Search by name or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lead Cards */}
      <div className="space-y-3">
        {filtered.map((lead) => {
          const config = STATUS_CONFIG[lead.status];
          return (
            <div
              key={lead.id}
              className="bg-white rounded-xl shadow-sm border border-border p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-neutral-900">{lead.name}</h3>
                    <Badge variant="outline" className={config.color}>
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mb-2">{lead.message}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <PoundSterling className="size-3" />
                      {formatCurrency(lead.propertyValue)}
                    </span>
                    <span className="font-medium text-neutral-600">{lead.enquiryType}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(lead.date).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Phone className="size-3.5" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Mail className="size-3.5" />
                    Email
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 py-12 text-center">
            <p className="text-sm text-neutral-400">No leads match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
