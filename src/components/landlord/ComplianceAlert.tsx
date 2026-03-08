import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { PropertyDocument } from "@/types/landlord";

type ComplianceAlertProps = Readonly<{
  expiringDocuments: PropertyDocument[];
  propertyId: string;
}>;

export default function ComplianceAlert({
  expiringDocuments,
  propertyId,
}: ComplianceAlertProps) {
  if (expiringDocuments.length === 0) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          {expiringDocuments.length} compliance document
          {expiringDocuments.length === 1 ? "" : "s"} expiring soon
        </p>
        <ul className="mt-1 space-y-0.5">
          {expiringDocuments.slice(0, 3).map((doc) => (
            <li
              key={doc.id}
              className="text-xs text-amber-700 dark:text-amber-300"
            >
              {doc.name}
              {doc.expiry_date
                ? ` -- expires ${new Date(doc.expiry_date).toLocaleDateString("en-GB")}`
                : ""}
            </li>
          ))}
          {expiringDocuments.length > 3 && (
            <li className="text-xs text-amber-700 dark:text-amber-300">
              and {expiringDocuments.length - 3} more...
            </li>
          )}
        </ul>
        <Link
          href={`/dashboard/landlord/properties/${propertyId}/documents`}
          className="mt-2 inline-block text-xs font-medium text-amber-800 underline hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100"
        >
          View documents
        </Link>
      </div>
    </div>
  );
}
