"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PiggyBank, Calculator } from "lucide-react";

/**
 * Client component that reads the current property price from the URL
 * (synced by SdltCalculator) and passes it as cross-tool context
 * to related tool links.
 */
export function SdltRelatedTools() {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    function readPrice() {
      const params = new URLSearchParams(window.location.search);
      const val = params.get("price");
      setPrice(val !== null && !isNaN(Number(val)) ? Number(val) : null);
    }
    readPrice();

    window.addEventListener("popstate", readPrice);
    const interval = setInterval(readPrice, 1000);
    return () => {
      window.removeEventListener("popstate", readPrice);
      clearInterval(interval);
    };
  }, []);

  const priceParam = price ? `?price=${price}` : "";

  return (
    <>
      <Link
        href={`/tools/mortgage-calculator${priceParam}`}
        className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        <PiggyBank className="h-5 w-5 text-brand-primary" />
        <div>
          <p className="text-sm font-semibold">Mortgage Calculator</p>
          <p className="text-xs text-neutral-500">
            Estimate your monthly repayments
          </p>
        </div>
      </Link>
      <Link
        href="/tools/affordability-calculator"
        className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        <Calculator className="h-5 w-5 text-brand-primary" />
        <div>
          <p className="text-sm font-semibold">
            Affordability Calculator
          </p>
          <p className="text-xs text-neutral-500">
            See how much you can borrow
          </p>
        </div>
      </Link>
    </>
  );
}
