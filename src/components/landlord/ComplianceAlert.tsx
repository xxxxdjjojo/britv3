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
    <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-light p-4 dark:border-warning/20 dark:bg-warning/10">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning dark:text-warning" />
      <div className="flex-1">
        <p className="text-sm font-medium text-warning dark:text-warning">
          {expiringDocuments.length} compliance document
          {expiringDocuments.length === 1 ? "" : "s"} expiring soon
        </p>
        <ul className="mt-1 space-y-0.5">
          {expiringDocuments.slice(0, 3).map((doc) => (
            <li
              key={doc.id}
              className="text-xs text-warning dark:text-warning"
            >
              {doc.name}
              {doc.expiry_date
                ? ` -- expires ${new Date(doc.expiry_date).toLocaleDateString("en-GB")}`
                : ""}
            </li>
          ))}
          {expiringDocuments.length > 3 && (
            <li className="text-xs text-warning dark:text-warning">
              and {expiringDocuments.length - 3} more...
            </li>
          )}
        </ul>
        <Link
          href={`/dashboard/landlord/properties/${propertyId}/documents`}
          className="mt-2 inline-block text-xs font-medium text-warning underline hover:text-warning/80 dark:text-warning dark:hover:text-warning/80"
        >
          View documents
        </Link>
      </div>
    </div>
  );
}
