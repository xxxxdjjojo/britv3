"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

type Props = Readonly<{
  currentYear: number;
  options: number[];
}>;

/**
 * Client component: tax year dropdown that navigates via URL ?year=YYYY.
 */
export function TaxYearSelector({ currentYear, options }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(yearStr: string | null) {
    if (!yearStr) return;
    router.push(`${pathname}?year=${yearStr}`);
  }

  function formatLabel(year: number) {
    return `${year}/${String(year + 1).slice(2)} Tax Year`;
  }

  return (
    <Select
      value={String(currentYear)}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-[200px]">
        <Calendar className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {formatLabel(year)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
