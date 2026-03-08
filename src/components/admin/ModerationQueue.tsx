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
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-700",
};

export function ModerationQueue({ listings, onApprove, onReject }: Props) {
  if (listings.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No items to review. All listings are clear.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-gray-900">{listing.title}</h3>
              {listing.address && (
                <p className="mt-0.5 text-sm text-gray-500">{listing.address}</p>
              )}
              {listing.created_at && (
                <p className="mt-0.5 text-xs text-gray-400">
                  Listed {new Date(listing.created_at).toLocaleDateString("en-GB")}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(listing.id)}
                className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(listing.id)}
                className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Reject
              </button>
              <a
                href={`/properties/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                View listing
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {listing.flags.map((flag, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    SEVERITY_STYLES[flag.severity] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {flag.reason.replace("_", " ")}
                </span>
                <span className="text-xs text-gray-500">{flag.details}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
