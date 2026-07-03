"use client";

import { useState } from "react";

export type TruthLeagueTableEntry = {
  rank: number;
  district: string;
  gapLabel: string;
  sampleAskingN: number;
  sampleSoldN: number;
  /** Per-area OG share-card URL (/api/og/league?area=…&rank=…&gapPct=…). */
  shareUrl: string;
};

/**
 * Client table for the Postcode Truth League: the full ranked district list
 * with a simple text filter. Fed plain props by the server league page —
 * suppression has already been applied upstream (suppressed districts never
 * reach this component).
 */
export function TruthLeagueTable({
  entries,
}: Readonly<{ entries: ReadonlyArray<TruthLeagueTableEntry> }>) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? entries.filter((entry) => entry.district.toLowerCase().includes(trimmed))
    : entries;

  return (
    <div>
      <label
        htmlFor="truth-league-filter"
        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Filter districts
      </label>
      <input
        id="truth-league-filter"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by district name…"
        className="mb-6 w-full max-w-sm rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-600">
          No ranked districts match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-4 py-3">
                  Rank
                </th>
                <th scope="col" className="px-4 py-3">
                  District
                </th>
                <th scope="col" className="px-4 py-3">
                  Asking vs sold gap
                </th>
                <th scope="col" className="px-4 py-3">
                  Listings (n)
                </th>
                <th scope="col" className="px-4 py-3">
                  Sales (n)
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Share</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.district} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-heading font-bold text-brand-primary-dark">
                    {entry.rank}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{entry.district}</td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">{entry.gapLabel}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {entry.sampleAskingN.toLocaleString("en-GB")}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {entry.sampleSoldN.toLocaleString("en-GB")}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={entry.shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
                    >
                      Share card
                    </a>
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
