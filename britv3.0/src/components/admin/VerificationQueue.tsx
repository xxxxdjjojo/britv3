"use client";

import { useState } from "react";
import type { VerificationQueueItem } from "@/services/admin-service";

type Props = Readonly<{
  verifications: VerificationQueueItem[];
  onApprove: (userId: string, notes?: string) => void;
  onReject: (userId: string, notes?: string) => void;
}>;

function VerificationCard({
  item,
  onApprove,
  onReject,
}: {
  item: VerificationQueueItem;
  onApprove: (userId: string, notes?: string) => void;
  onReject: (userId: string, notes?: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const businessName =
    typeof item.provider_details === "object" && item.provider_details !== null
      ? (item.provider_details as Record<string, unknown>).business_name
      : null;

  const documentUrl =
    typeof item.provider_details === "object" && item.provider_details !== null
      ? (item.provider_details as Record<string, unknown>).document_url
      : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-gray-900">
            {item.full_name ?? "Unknown provider"}
          </h3>
          {businessName !== null && businessName !== undefined && (
            <p className="mt-0.5 text-sm text-gray-600">
              {String(businessName)}
            </p>
          )}
          <p className="mt-0.5 text-sm text-gray-500">{item.email ?? "—"}</p>
          {item.created_at && (
            <p className="mt-0.5 text-xs text-gray-400">
              Submitted {new Date(item.created_at).toLocaleDateString("en-GB")}
            </p>
          )}
        </div>

        {documentUrl !== null && documentUrl !== undefined && (
          <a
            href={String(documentUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
          >
            View documents
          </a>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="text-xs text-gray-500 underline"
        >
          {showNotes ? "Hide notes" : "Add notes (optional)"}
        </button>

        {showNotes && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Decision notes…"
            rows={2}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onApprove(item.id, notes || undefined)}
            className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(item.id, notes || undefined)}
            className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export function VerificationQueue({ verifications, onApprove, onReject }: Props) {
  if (verifications.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No pending verifications. All applications have been reviewed.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {verifications.map((item) => (
        <VerificationCard
          key={item.id}
          item={item}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
