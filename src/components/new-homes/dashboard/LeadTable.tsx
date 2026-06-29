"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildLeadsCsv } from "@/lib/new-homes/csv";
import { formatGbp } from "@/lib/new-homes/format";
import type {
  DevelopmentLead,
  DevelopmentLeadStatus,
} from "@/lib/new-homes/types";

const STATUS_STYLES: Record<DevelopmentLeadStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  qualified: "bg-indigo-100 text-indigo-800",
  contacted: "bg-sky-100 text-sky-800",
  viewing_booked: "bg-amber-100 text-amber-900",
  reserved: "bg-emerald-100 text-emerald-800",
  closed: "bg-neutral-200 text-neutral-600",
  lost: "bg-rose-100 text-rose-700",
};

const LEAD_TYPE_LABELS: Record<string, string> = {
  register_interest: "Interest",
  book_viewing: "Viewing",
  request_brochure: "Brochure",
  ask_question: "Question",
};

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function LeadTable({ leads }: Readonly<{ leads: DevelopmentLead[] }>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) =>
      [l.name, l.email, l.developmentName, l.status, l.leadType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [leads, query]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-neutral-900">Leads</h2>
          <p className="text-sm text-neutral-500">
            {filtered.length} of {leads.length} qualified buyer enquiries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads"
            className="h-9 w-40 rounded-lg border border-neutral-300 px-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary sm:w-56"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={leads.length === 0}
            onClick={() => downloadCsv("truedeed-leads.csv", buildLeadsCsv(filtered))}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="p-8 text-center text-sm text-neutral-500">
          {leads.length === 0
            ? "No leads yet. They'll appear here the moment a buyer enquires."
            : "No leads match your search."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Buyer</th>
                <th className="px-4 py-2.5 font-semibold">Development</th>
                <th className="px-4 py-2.5 font-semibold">Type</th>
                <th className="px-4 py-2.5 font-semibold">Budget</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{lead.name}</p>
                    <p className="text-xs text-neutral-500">{lead.email}</p>
                    {lead.phone ? (
                      <p className="text-xs text-neutral-400">{lead.phone}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {lead.developmentName ?? "—"}
                    {lead.preferredPlot ? (
                      <span className="block text-xs text-neutral-400">
                        Plot {lead.preferredPlot}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                      {LEAD_TYPE_LABELS[lead.leadType] ?? lead.leadType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {lead.budget ? formatGbp(lead.budget) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs font-semibold capitalize " +
                        (STATUS_STYLES[lead.status] ?? "bg-neutral-100 text-neutral-600")
                      }
                    >
                      {lead.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(lead.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
