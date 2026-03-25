import Link from "next/link";
import type { SoldPriceRecord } from "@/types/areas";

type SoldPriceRowProps = Readonly<{ record: SoldPriceRecord }>;

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  D: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
  S: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400" },
  T: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
  F: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400" },
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
          <span className={`font-medium ${record.vsAsking > 0 ? "text-green-600" : record.vsAsking < 0 ? "text-red-500" : "text-neutral-400"}`}>
            {record.vsAsking > 0 ? "+" : ""}{record.vsAsking}%
          </span>
        ) : (<span className="text-neutral-300">&mdash;</span>)}
      </td>
    </tr>
  );
}
