"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import type { QuoteStatus } from "@/types/marketplace";

type QuoteRow = {
  id: string;
  quote_number: string;
  rfq_title: string;
  rfq_id: string;
  total_amount: number;
  status: QuoteStatus;
  created_at: string;
};

type StatusFilter = QuoteStatus | "all";

const STATUS_BADGE: Record<QuoteStatus, string> = {
  draft:
    "bg-neutral-100 text-neutral-500",
  sent: "bg-brand-accent-light text-brand-accent",
  viewed: "bg-brand-accent-light text-brand-accent",
  accepted: "bg-success-light text-success",
  declined: "bg-error-light text-error",
  expired: "bg-neutral-100 text-neutral-500",
  withdrawn: "bg-neutral-100 text-neutral-500",
};

const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "sent",
  "draft",
  "accepted",
  "declined",
];

function fmtGBP(pence: number): string {
  return pence.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  });
}

export default function ProviderQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/providers/quotes${qs}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes ?? data.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Derived metrics
  const outstanding = quotes
    .filter((q) => q.status === "sent" || q.status === "viewed")
    .reduce((sum, q) => sum + q.total_amount, 0);

  const acceptedCount = quotes.filter((q) => q.status === "accepted").length;
  const sentCount = quotes.filter(
    (q) =>
      q.status === "sent" ||
      q.status === "accepted" ||
      q.status === "declined",
  ).length;
  const conversionRate =
    sentCount > 0 ? Math.round((acceptedCount / sentCount) * 100) : 0;

  // Client-side search filter
  const filtered = quotes.filter((q) => {
    if (!search.trim()) return true;
    const q2 = search.toLowerCase();
    return (
      q.quote_number.toLowerCase().includes(q2) ||
      q.rfq_title.toLowerCase().includes(q2)
    );
  });

  return (
    <div className="min-h-screen bg-neutral-50 p-0">
      <div className="pt-8 px-10 pb-20 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-brand-secondary-dark font-sans mb-2 block">
              Provider Overview
            </span>
            <h1 className="text-4xl font-extrabold text-neutral-900 font-heading tracking-tight">
              Quote Management
            </h1>
          </div>
          <Link
            href="/dashboard/provider/quotes/builder"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary-dark to-brand-primary text-white px-7 py-3.5 rounded-md font-semibold text-sm hover:opacity-90 active:scale-95 transition-all duration-300"
            aria-label="Create new quote"
          >
            <Plus className="size-4" />
            New Quote
          </Link>
        </div>

        {/* ── Stats & Filter bar ── */}
        <section className="bg-neutral-100 rounded-xl p-7 mb-10 flex flex-wrap gap-6 items-center">
          {/* Status filter tabs */}
          <div className="flex gap-3 items-center">
            <span className="text-xs font-sans uppercase tracking-widest text-neutral-400">
              Filter Status:
            </span>
            <div className="flex bg-neutral-200/50 p-1 rounded-lg gap-0.5">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  aria-pressed={filter === status}
                  className={`px-4 py-2 text-xs font-bold rounded-md transition-colors capitalize ${
                    filter === status
                      ? "bg-white text-brand-primary shadow-sm"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {status === "all" ? "All" : status}
                </button>
              ))}
            </div>
          </div>

          <div className="h-7 w-px bg-neutral-300 mx-2 hidden lg:block" />

          {/* KPIs */}
          <div className="flex gap-8">
            <div>
              <p className="text-[10px] text-neutral-400 font-sans uppercase tracking-widest mb-1">
                Total Outstanding
              </p>
              <p className="text-xl font-bold font-heading text-brand-primary">
                {fmtGBP(outstanding)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 font-sans uppercase tracking-widest mb-1">
                Conversion Rate
              </p>
              <p className="text-xl font-bold font-heading text-brand-secondary-dark">
                {conversionRate}%
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="ml-auto flex items-center gap-3 bg-white border border-neutral-200/50 px-4 py-2 rounded-lg">
            <svg
              className="size-4 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 4.65 16.65a7.5 7.5 0 0 0 11.7 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference or property..."
              className="bg-transparent border-none text-sm focus:ring-0 w-56 text-neutral-900 placeholder:text-neutral-400 outline-none"
            />
          </div>
        </section>

        {/* ── Quote Table ── */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-[10px] uppercase tracking-[0.15em] text-neutral-500 font-bold border-b border-neutral-100">
                <th className="px-8 py-5">Reference</th>
                <th className="px-8 py-5">Property / Client</th>
                <th className="px-8 py-5">Total Amount</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center">
                    <div
                      className="mx-auto size-7 animate-spin rounded-full border-2 border-brand-primary-dark border-t-transparent"
                      aria-label="Loading quotes"
                    />
                    <p className="mt-3 text-sm text-neutral-500">Loading quotes…</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex size-14 items-center justify-center rounded-full bg-neutral-100">
                        <FileText className="size-7 text-neutral-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">
                          No quotes yet
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          Create your first quote to get started.
                        </p>
                      </div>
                      <Link
                        href="/dashboard/provider/quotes/builder"
                        className="inline-flex items-center gap-2 bg-brand-primary-dark text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Plus className="size-4" />
                        Create Quote
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-neutral-50/50 transition-colors group"
                  >
                    <td className="px-8 py-5 font-medium font-heading text-neutral-900 text-sm">
                      {quote.quote_number}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <Link
                          href={`/dashboard/rfqs/${quote.rfq_id}`}
                          className="text-sm font-semibold text-neutral-900 hover:text-brand-primary transition-colors"
                        >
                          {quote.rfq_title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-bold text-neutral-900 text-sm">
                      {fmtGBP(quote.total_amount)}
                    </td>
                    <td className="px-8 py-5 text-sm text-neutral-600">
                      {new Date(quote.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[quote.status]}`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {quote.status === "accepted" && (
                          <Link
                            href={`/dashboard/provider/quotes/${quote.id}/invoice`}
                            className="px-3 py-1.5 bg-brand-primary-dark text-white text-[10px] font-bold rounded uppercase tracking-wider hover:opacity-90 transition-opacity"
                            aria-label={`Generate invoice for quote ${quote.quote_number}`}
                          >
                            Invoice Now
                          </Link>
                        )}
                        {(quote.status === "sent" || quote.status === "viewed") && (
                          <Link
                            href={`/dashboard/provider/quotes/builder?edit=${quote.id}`}
                            className="p-1.5 hover:bg-white rounded-md text-neutral-400 hover:text-brand-primary shadow-sm border border-transparent hover:border-neutral-200 transition-colors"
                            title="Edit Quote"
                          >
                            <svg
                              className="size-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                              />
                            </svg>
                          </Link>
                        )}
                        {quote.status === "draft" && (
                          <Link
                            href={`/dashboard/provider/quotes/builder?edit=${quote.id}`}
                            className="p-1.5 hover:bg-white rounded-md text-neutral-400 hover:text-brand-primary shadow-sm border border-transparent hover:border-neutral-200 transition-colors"
                            title="Edit Draft"
                          >
                            <svg
                              className="size-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                              />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Table footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-8 py-5 bg-neutral-50/50 flex items-center justify-between border-t border-neutral-100">
              <p className="text-xs text-neutral-500">
                Showing{" "}
                <span className="font-bold text-neutral-900">{filtered.length}</span>{" "}
                quote{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        {/* ── Quote Insights ── */}
        <div className="mt-16 flex flex-col md:flex-row gap-10 items-start">
          <div className="md:w-2/3">
            <h3 className="text-2xl font-bold font-heading text-brand-primary mb-4">
              Quote Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-neutral-100 rounded-xl p-6 border-l-4 border-brand-secondary-dark">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-secondary-dark mb-2">
                  High Value Opportunity
                </h4>
                <p className="text-sm text-neutral-600 leading-relaxed mb-3">
                  Quotes sent within 24 hours of a site visit have significantly
                  higher acceptance rates. Keep your response time short.
                </p>
                <span className="text-xs font-bold text-brand-primary flex items-center gap-1">
                  View Template Advice
                  <svg
                    className="size-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </span>
              </div>
              <div className="bg-neutral-100 rounded-xl p-6 border-l-4 border-brand-primary-dark">
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-primary-dark mb-2">
                  Portfolio Synergy
                </h4>
                <p className="text-sm text-neutral-600 leading-relaxed mb-3">
                  You have active quotes in the same area. Consider a logistics
                  discount to secure all contracts at once.
                </p>
                <span className="text-xs font-bold text-brand-primary flex items-center gap-1">
                  Bundle Options
                  <svg
                    className="size-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Premium CTA card */}
          <div className="md:w-1/3 bg-brand-primary p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_white,_transparent)]" />
            <h3 className="text-xl font-bold text-white mb-3 relative z-10">
              Premium Assistance
            </h3>
            <p className="text-brand-primary-lighter text-sm leading-relaxed mb-5 relative z-10">
              Need a legal review for a complex quote? Our Estate Advocates are
              available for consultation.
            </p>
            <button className="w-full py-3 bg-brand-secondary text-brand-secondary-dark font-bold rounded-md hover:-translate-y-0.5 transition-transform relative z-10 text-sm">
              Book Consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
