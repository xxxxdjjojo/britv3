"use client";

import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { SaleProgressionStage, SaleProgressionDocument } from "@/types/seller";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  uploaded: { icon: CheckCircle, label: "Uploaded", className: "text-emerald-500 bg-emerald-50" },
  pending: { icon: Clock, label: "Pending", className: "text-amber-500 bg-amber-50" },
  missing: { icon: AlertCircle, label: "Required", className: "text-red-500 bg-red-50" },
} as const;

const DEFAULT_DOCUMENTS: SaleProgressionDocument[] = [
  { name: "Title Deeds", url: null, status: "missing", stage: 2 },
  { name: "TA6 Property Information Form", url: null, status: "missing", stage: 2 },
  { name: "TA10 Fittings and Contents", url: null, status: "missing", stage: 2 },
  { name: "EPC Certificate", url: null, status: "missing", stage: 1 },
  { name: "Local Authority Search", url: null, status: "missing", stage: 3 },
  { name: "Survey Report", url: null, status: "missing", stage: 4 },
  { name: "Mortgage Offer Letter", url: null, status: "missing", stage: 5 },
  { name: "Draft Contract", url: null, status: "missing", stage: 6 },
];

type Props = Readonly<{
  progression: SaleProgressionStage;
}>;

export function SaleDocumentsList({ progression }: Props) {
  const docs: SaleProgressionDocument[] =
    progression.documents.length > 0 ? progression.documents : DEFAULT_DOCUMENTS;

  const uploaded = docs.filter((d) => d.status === "uploaded").length;
  const total = docs.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-slate-900 font-['Plus_Jakarta_Sans']">
          Documents
        </h3>
        <span className="text-sm font-semibold text-slate-500">
          {uploaded}/{total} uploaded
        </span>
      </div>

      <ul className="space-y-3">
        {docs.map((doc) => {
          const config = STATUS_CONFIG[doc.status];
          const Icon = config.icon;
          return (
            <li
              key={`${doc.name}-${doc.stage}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0",
                  config.className,
                )}
              >
                <Icon size={14} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {doc.name}
                </p>
                <p className="text-xs text-slate-400">
                  Required at stage {doc.stage}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#1B4D3E] font-medium hover:underline"
                  >
                    View
                  </a>
                ) : (
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      config.className,
                    )}
                  >
                    {config.label}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
