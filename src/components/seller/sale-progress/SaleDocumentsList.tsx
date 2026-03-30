
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { SaleProgressionStage, SaleProgressionDocument } from "@/types/seller";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  uploaded: {
    icon: CheckCircle,
    label: "Uploaded",
    iconClass: "text-emerald-500",
    bgClass: "bg-emerald-50",
    pillClass: "bg-emerald-100 text-emerald-700",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    iconClass: "text-amber-500",
    bgClass: "bg-amber-50",
    pillClass: "bg-amber-100 text-amber-700",
  },
  missing: {
    icon: AlertCircle,
    label: "Required",
    iconClass: "text-red-500",
    bgClass: "bg-red-50",
    pillClass: "bg-red-100 text-red-600",
  },
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
  const uploadedPct = Math.round((uploaded / total) * 100);

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-[#1a1c1c]">Documents</h3>
        <span className="text-sm font-semibold text-[#1a1c1c]/50">
          {uploaded}/{total}
        </span>
      </div>

      {/* Doc progress bar */}
      <div className="h-1.5 rounded-full bg-[#e3e2e1] mb-5">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${uploadedPct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {docs.map((doc) => {
          const config = STATUS_CONFIG[doc.status];
          const Icon = config.icon;
          return (
            <li
              key={`${doc.name}-${doc.stage}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#faf9f8] transition-colors"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0",
                  config.bgClass,
                )}
              >
                <Icon
                  size={14}
                  className={config.iconClass}
                  strokeWidth={1.25}
                />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a1c1c] truncate">
                  {doc.name}
                </p>
                <p className="text-xs text-[#1a1c1c]/30">
                  Stage {doc.stage}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#1B4D3E] font-semibold hover:underline"
                  >
                    View
                  </a>
                ) : (
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      config.pillClass,
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
