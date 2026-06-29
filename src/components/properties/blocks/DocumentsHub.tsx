import { FileText, FileCheck2, FileClock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { PropertyView } from "@/lib/properties/build-property-view";

type DocRow = {
  label: string;
  state: "available" | "external" | "pending";
  href?: string;
  note: string;
};

/**
 * Block 10 (documents) — a single hub for the property's paperwork. Surfaces
 * what is actually attached (EPC certificate, floor plans) and is honest about
 * what is not yet provided (title register, property information form, lease),
 * rather than scattering documents through the page. Availability-state driven.
 */
export function DocumentsHub({ view }: { view: PropertyView }) {
  const { detail, floors, propertyUrl } = view;
  const { property } = detail;

  const epcDoc = detail.media.find((m) => m.mediaType === "epc_document");
  const isLeasehold = property.tenure === "leasehold";

  const rows: DocRow[] = [
    epcDoc
      ? { label: "EPC certificate", state: "available", href: epcDoc.url, note: "Attached" }
      : {
          label: "EPC certificate",
          state: "external",
          href: `https://find-energy-certificate.service.gov.uk/find-a-certificate/search-by-postcode?postcode=${encodeURIComponent(property.postcode)}`,
          note: "Look up on gov.uk",
        },
    floors.length > 0
      ? {
          label: `Floor plan${floors.length === 1 ? "" : "s"}`,
          state: "available",
          href: `${propertyUrl}#floor-plans`,
          note: `${floors.length} attached`,
        }
      : { label: "Floor plan", state: "pending", note: "Not provided" },
    { label: "Title register", state: "pending", note: "Request from the agent" },
    { label: "Property information form (TA6)", state: "pending", note: "Provided during conveyancing" },
    ...(isLeasehold
      ? [{ label: "Lease & management pack", state: "pending" as const, note: "Request from the agent" }]
      : []),
  ];

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Documents</h2>
      <Separator className="mb-4" />
      <ul className="divide-y rounded-xl border bg-card">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 p-3">
            <span className="flex items-center gap-2.5 text-sm">
              <DocIcon state={row.state} />
              {row.label}
            </span>
            {row.href ? (
              <a
                href={row.href}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs font-medium text-brand-primary hover:underline"
              >
                {row.note} <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className="shrink-0 text-xs text-muted-foreground">{row.note}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DocIcon({ state }: { state: DocRow["state"] }) {
  if (state === "available")
    return <FileCheck2 className="size-4 text-success" aria-hidden="true" />;
  if (state === "pending")
    return <FileClock className="size-4 text-muted-foreground/60" aria-hidden="true" />;
  return <FileText className="size-4 text-brand-primary" aria-hidden="true" />;
}
