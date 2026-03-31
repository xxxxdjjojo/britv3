
import { CheckCircle, Clock, AlertCircle, Eye, Download } from "lucide-react";
import type { SaleProgressionStage, SaleProgressionDocument } from "@/types/seller";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  uploaded: {
    icon: CheckCircle,
    label: "Uploaded",
    iconClass: "text-emerald-500",
    pillClass: "bg-emerald-100 text-emerald-700",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    iconClass: "text-amber-500",
    pillClass: "bg-amber-100 text-amber-700",
  },
  missing: {
    icon: AlertCircle,
    label: "Required",
    iconClass: "text-red-500",
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
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-emerald-900 text-lg">
          Documents
        </h3>
        <span className="text-sm font-semibold text-stone-400">
          {uploaded}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-stone-100 mb-6">
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
              className="group flex items-center gap-3 p-4 rounded-xl hover:bg-stone-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-stone-100">
                <Icon
                  size={16}
                  className={config.iconClass}
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-emerald-900 truncate">
                  {doc.name}
                </p>
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                  Stage {doc.stage}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {doc.url ? (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-stone-400 hover:text-emerald-900 transition-colors"
                      aria-label="View document"
                    >
                      <Eye size={16} strokeWidth={1.25} />
                    </a>
                    <a
                      href={doc.url}
                      download
                      className="text-stone-400 hover:text-emerald-900 transition-colors"
                      aria-label="Download document"
                    >
                      <Download size={16} strokeWidth={1.25} />
                    </a>
                  </div>
                ) : (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide",
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
