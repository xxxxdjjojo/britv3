"use client";

import type { ReportedReview } from "@/services/admin-service";

type Props = Readonly<{
  reports: ReportedReview[];
  onResolve: (reportId: string, note?: string) => void;
  onDismiss: (reportId: string, note?: string) => void;
}>;

function ReportCard({
  report,
  onResolve,
  onDismiss,
}: {
  report: ReportedReview;
  onResolve: (reportId: string, note?: string) => void;
  onDismiss: (reportId: string, note?: string) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              Report #{report.id.slice(0, 8)}
            </span>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              open
            </span>
          </div>
          {report.reason && (
            <p className="mt-1 text-sm text-gray-600">
              Reason: <span className="font-medium">{report.reason}</span>
            </p>
          )}
          {report.entity_id && (
            <p className="mt-0.5 text-xs font-mono text-gray-400">
              Review ID: {report.entity_id}
            </p>
          )}
          {report.created_at && (
            <p className="mt-0.5 text-xs text-gray-400">
              Reported {new Date(report.created_at).toLocaleDateString("en-GB")}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onResolve(report.id)}
          className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Remove review
        </button>
        <button
          onClick={() => onDismiss(report.id)}
          className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
        >
          Dismiss report
        </button>
      </div>
    </div>
  );
}

export function ReviewModerationQueue({ reports, onResolve, onDismiss }: Props) {
  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No reported reviews. Everything looks good.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onResolve={onResolve}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
