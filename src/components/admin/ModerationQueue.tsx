"use client";

import type { ModerationFlag } from "@/services/moderation-service";

export type FlaggedListing = {
  id: string;
  title: string;
  address: string | null;
  flags: ModerationFlag[];
  created_at: string | null;
};

type Props = Readonly<{
  listings: FlaggedListing[];
  onApprove: (listingId: string) => void;
  onReject: (listingId: string) => void;
}>;

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-error-light text-error dark:bg-error/20 dark:text-error",
  medium: "bg-warning-light text-warning dark:bg-warning/20 dark:text-warning",
  low: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

export function ModerationQueue({ listings, onApprove, onReject }: Props) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl bg-card p-8 text-center font-body text-sm text-neutral-500 ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
        No items to review. All listings are clear.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="rounded-xl bg-card p-4 ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 hover:shadow-md transition-shadow"
        >
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-body text-sm font-medium text-foreground">{listing.title}</h3>
              {listing.address && (
                <p className="mt-0.5 font-body text-xs text-neutral-500">{listing.address}</p>
              )}
              {listing.created_at && (
                <p className="mt-0.5 font-body text-xs text-neutral-500">
                  Listed {new Date(listing.created_at).toLocaleDateString("en-GB")}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(listing.id)}
                className="rounded-lg bg-brand-primary px-3 py-1.5 font-body text-xs font-medium text-white hover:bg-brand-primary/90 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(listing.id)}
                className="rounded-lg bg-destructive px-3 py-1.5 font-body text-xs font-medium text-white hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
              >
                Reject
              </button>
              <a
                href={`/properties/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 px-3 py-1.5 font-body text-xs font-medium text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
              >
                View listing
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {listing.flags.map((flag, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 font-body text-xs font-medium ${
                    SEVERITY_STYLES[flag.severity] ?? "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {flag.reason.replace("_", " ")}
                </span>
                <span className="font-body text-xs text-neutral-500">{flag.details}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
