"use client";

import { useState } from "react";
import { Search } from "lucide-react";

type Pledge = {
  id: string;
  display_name: string | null;
  area: string | null;
  pledged_at: string;
};

type Props = Readonly<{
  pledges: Pledge[];
}>;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function RegisterSearch({ pledges }: Props) {
  const [query, setQuery] = useState("");

  const filtered =
    query.trim() === ""
      ? pledges
      : pledges.filter((p) => {
          const q = query.toLowerCase();
          return (
            (p.display_name ?? "").toLowerCase().includes(q) ||
            (p.area ?? "").toLowerCase().includes(q)
          );
        });

  return (
    <section aria-labelledby="register-heading">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2
          id="register-heading"
          className="font-heading text-2xl font-bold text-foreground"
        >
          The register
          {pledges.length > 0 && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({pledges.length} landlord{pledges.length !== 1 ? "s" : ""})
            </span>
          )}
        </h2>
      </div>

      {pledges.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted px-6 py-10 text-center text-sm text-muted-foreground">
          No landlords have pledged yet — be the first.
        </p>
      ) : (
        <>
          <div className="relative mb-6">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search by name or area…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary sm:max-w-sm"
              aria-label="Search the register"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-background">
              {filtered.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-foreground">
                      {p.display_name ?? "Anonymous landlord"}
                    </p>
                    {p.area && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{p.area}</p>
                    )}
                  </div>
                  <time
                    dateTime={p.pledged_at}
                    className="shrink-0 text-xs text-muted-foreground"
                  >
                    {formatDate(p.pledged_at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
