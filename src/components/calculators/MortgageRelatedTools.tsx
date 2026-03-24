"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calculator, PiggyBank, TrendingUp } from "lucide-react";

/**
 * Client component that reads the current property price from the URL
 * (synced by MortgageCalculator) and passes it as cross-tool context
 * to related tool links.
 */
export function MortgageRelatedTools() {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    function readPrice() {
      const params = new URLSearchParams(window.location.search);
      const val = params.get("price");
      setPrice(val !== null && !isNaN(Number(val)) ? Number(val) : null);
    }
    readPrice();

    // Re-read on popstate (back/forward)
    window.addEventListener("popstate", readPrice);
    // Also poll briefly since replaceState doesn't fire events
    const interval = setInterval(readPrice, 1000);
    return () => {
      window.removeEventListener("popstate", readPrice);
      clearInterval(interval);
    };
  }, []);

  const priceParam = price ? `?price=${price}` : "";

  return (
    <ul className="space-y-4">
      <li>
        <Link
          href={`/tools/stamp-duty-calculator${priceParam}`}
          className="flex items-center gap-3 text-sm font-medium text-neutral-600 transition-colors hover:text-brand-primary dark:text-neutral-400"
        >
          <Calculator className="h-5 w-5 text-neutral-300" />
          Stamp Duty Calculator
        </Link>
      </li>
      <li>
        <Link
          href="/tools/affordability-calculator"
          className="flex items-center gap-3 text-sm font-medium text-neutral-600 transition-colors hover:text-brand-primary dark:text-neutral-400"
        >
          <PiggyBank className="h-5 w-5 text-neutral-300" />
          How much can I borrow?
        </Link>
      </li>
      <li>
        <Link
          href="/tools/rental-yield-calculator"
          className="flex items-center gap-3 text-sm font-medium text-neutral-600 transition-colors hover:text-brand-primary dark:text-neutral-400"
        >
          <TrendingUp className="h-5 w-5 text-neutral-300" />
          Buy-to-Let Yield Tool
        </Link>
      </li>
    </ul>
  );
}
