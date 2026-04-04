import Link from "next/link";
import type { SoldPriceRecord } from "@/types/areas";

type SoldPriceRowProps = Readonly<{ record: SoldPriceRecord }>;

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  D: { bg: "bg-success-light dark:bg-success/20", text: "text-success dark:text-success" },
  S: { bg: "bg-warning-light dark:bg-warning/20", text: "text-warning dark:text-warning" },
  T: { bg: "bg-brand-accent-light dark:bg-brand-accent/20", text: "text-brand-accent dark:text-brand-accent" },
  F: { bg: "bg-brand-accent-light dark:bg-brand-accent/20", text: "text-brand-accent dark:text-brand-accent" },
  O: { bg: "bg-neutral-50 dark:bg-neutral-900/20", text: "text-neutral-600 dark:text-neutral-400" },
};

export function SoldPriceRow({ record }: SoldPriceRowProps) {
  const styles = TYPE_STYLES[record.propertyType] ?? TYPE_STYLES.O;
  return (
    <tr className="transition-colors even:bg-neutral-50 hover:bg-neutral-100 dark:even:bg-neutral-800/20 dark:hover:bg-neutral-800/30">
      <td className="px-6 py-4">
        <Link href={`/sold-prices/${record.areaSlug}/${record.slug}`} className="hover:text-primary transition-colors">
          <div className="font-medium">{record.address}</div>
          <div className="text-xs uppercase text-neutral-400">{record.postcode}</div>
        </Link>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${styles.bg} ${styles.text}`}>{record.propertyTypeLabel}</span>
          <span className="text-neutral-500">{record.beds} Bed</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right text-neutral-500">{record.dateFormatted}</td>
      <td className="px-6 py-4 text-right font-bold">{record.priceFormatted}</td>
      <td className="px-6 py-4 text-right">
        {record.vsAsking !== null ? (
          <span className={`font-medium ${record.vsAsking > 0 ? "text-success" : record.vsAsking < 0 ? "text-error" : "text-neutral-400"}`}>
            {record.vsAsking > 0 ? "+" : ""}{record.vsAsking}%
          </span>
        ) : (<span className="text-neutral-300">&mdash;</span>)}
      </td>
    </tr>
  );
}
