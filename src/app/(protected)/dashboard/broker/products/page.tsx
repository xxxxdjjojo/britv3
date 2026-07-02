"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import { Search, Eye, CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type RateType = "fixed" | "variable" | "tracker";

type MortgageProduct = {
  id: string;
  lender: string;
  productName: string;
  rate: number;
  rateType: RateType;
  maxLtv: number;
  term: number;
  fees: number;
  monthlyPayment: number;
  aprc: number;
};

const MOCK_PRODUCTS: MortgageProduct[] = [
  { id: "1", lender: "Natwest", productName: "2-Year Fixed Premier", rate: 4.19, rateType: "fixed", maxLtv: 90, term: 2, fees: 999, monthlyPayment: 1342, aprc: 6.8 },
  { id: "2", lender: "HSBC", productName: "5-Year Fixed First Home", rate: 3.94, rateType: "fixed", maxLtv: 95, term: 5, fees: 0, monthlyPayment: 1298, aprc: 5.2 },
  { id: "3", lender: "Barclays", productName: "2-Year Tracker", rate: 4.49, rateType: "tracker", maxLtv: 85, term: 2, fees: 749, monthlyPayment: 1394, aprc: 7.1 },
  { id: "4", lender: "Halifax", productName: "2-Year Fixed Standard", rate: 4.29, rateType: "fixed", maxLtv: 80, term: 2, fees: 1499, monthlyPayment: 1359, aprc: 6.9 },
  { id: "5", lender: "Nationwide", productName: "5-Year Fixed Loyalty", rate: 3.89, rateType: "fixed", maxLtv: 75, term: 5, fees: 999, monthlyPayment: 1289, aprc: 5.1 },
  { id: "6", lender: "Santander", productName: "2-Year Variable", rate: 4.74, rateType: "variable", maxLtv: 90, term: 2, fees: 0, monthlyPayment: 1437, aprc: 7.3 },
  { id: "7", lender: "Virgin Money", productName: "3-Year Fixed", rate: 4.09, rateType: "fixed", maxLtv: 85, term: 3, fees: 995, monthlyPayment: 1325, aprc: 6.2 },
  { id: "8", lender: "TSB", productName: "5-Year Fixed BTL", rate: 4.54, rateType: "fixed", maxLtv: 75, term: 5, fees: 1995, monthlyPayment: 1402, aprc: 5.8 },
  { id: "9", lender: "Skipton BS", productName: "2-Year Tracker No Fee", rate: 4.39, rateType: "tracker", maxLtv: 80, term: 2, fees: 0, monthlyPayment: 1377, aprc: 7.0 },
  { id: "10", lender: "Leeds BS", productName: "10-Year Fixed", rate: 4.29, rateType: "fixed", maxLtv: 70, term: 10, fees: 999, monthlyPayment: 1359, aprc: 4.9 },
  { id: "11", lender: "Coventry BS", productName: "5-Year Fixed Exclusive", rate: 3.79, rateType: "fixed", maxLtv: 60, term: 5, fees: 999, monthlyPayment: 1272, aprc: 4.8 },
  { id: "12", lender: "Metro Bank", productName: "2-Year Variable Flex", rate: 4.99, rateType: "variable", maxLtv: 80, term: 2, fees: 0, monthlyPayment: 1480, aprc: 7.5 },
  { id: "13", lender: "Natwest", productName: "5-Year Fixed Green", rate: 3.84, rateType: "fixed", maxLtv: 85, term: 5, fees: 0, monthlyPayment: 1280, aprc: 5.0 },
  { id: "14", lender: "HSBC", productName: "2-Year Fixed Standard", rate: 4.14, rateType: "fixed", maxLtv: 75, term: 2, fees: 999, monthlyPayment: 1334, aprc: 6.7 },
  { id: "15", lender: "Barclays", productName: "5-Year Fixed Premier", rate: 3.99, rateType: "fixed", maxLtv: 80, term: 5, fees: 749, monthlyPayment: 1306, aprc: 5.3 },
];

const RATE_TYPE_LABELS: Record<RateType, string> = {
  fixed: "Fixed",
  variable: "Variable",
  tracker: "Tracker",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [rateTypeFilter, setRateTypeFilter] = useState<string>("all");
  const [maxLtvFilter, setMaxLtvFilter] = useState<string>("all");
  const [termFilter, setTermFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.lender.toLowerCase().includes(q) &&
          !p.productName.toLowerCase().includes(q)
        )
          return false;
      }
      if (rateTypeFilter !== "all" && p.rateType !== rateTypeFilter) return false;
      if (maxLtvFilter !== "all" && p.maxLtv < Number(maxLtvFilter)) return false;
      if (termFilter !== "all" && p.term !== Number(termFilter)) return false;
      return true;
    });
  }, [search, rateTypeFilter, maxLtvFilter, termFilter]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      {/* Editorial page header */}
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          Mortgage Broker
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
          Product Database
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Compare mortgage products across lenders to find the best deal for your clients.
        </p>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
          Quick Search
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <Input
              id="product-search"
              placeholder="Search by lender or product code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* LTV select */}
          <Select value={maxLtvFilter} onValueChange={(value: string | null) => setMaxLtvFilter(value ?? "")}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="LTV" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">LTV</SelectItem>
              <SelectItem value="95">95%+</SelectItem>
              <SelectItem value="90">90%+</SelectItem>
              <SelectItem value="85">85%+</SelectItem>
              <SelectItem value="80">80%+</SelectItem>
              <SelectItem value="75">75%+</SelectItem>
            </SelectContent>
          </Select>

          {/* Term select */}
          <Select value={termFilter} onValueChange={(value: string | null) => setTermFilter(value ?? "")}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Term</SelectItem>
              <SelectItem value="2">2 years</SelectItem>
              <SelectItem value="3">3 years</SelectItem>
              <SelectItem value="5">5 years</SelectItem>
              <SelectItem value="10">10 years</SelectItem>
            </SelectContent>
          </Select>

          {/* Rate type pill toggles */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            {(["all", "fixed", "variable", "tracker"] as const).map((type) => {
              const isActive = rateTypeFilter === type;
              const label = type === "all" ? "All" : RATE_TYPE_LABELS[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRateTypeFilter(type)}
                  className={cn(
                    "px-3 py-2 text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-brand-primary text-white"
                      : "bg-surface text-neutral-600 hover:bg-muted",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Available Products section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <SectionHeader title="Available Products" />
            <p className="mt-0.5 text-xs text-neutral-400">
              Showing {filtered.length} results based on current criteria
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {selectedIds.size > 0 && (
              <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary">
                {selectedIds.size} selected
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-brand-primary text-brand-primary hover:bg-brand-primary/5"
              disabled={selectedIds.size < 2}
            >
              Compare Side-by-Side
            </Button>
          </div>
        </div>

        {/* Product cards */}
        <div className="flex flex-col gap-3">
          {filtered.map((product) => {
            const isSelected = selectedIds.has(product.id);
            return (
              <div
                key={product.id}
                className={cn(
                  "rounded-xl border bg-surface p-4 transition-shadow hover:shadow-sm",
                  isSelected ? "border-brand-primary" : "border-border",
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    type="button"
                    aria-label={`Select ${product.lender} ${product.productName}`}
                    onClick={() => toggleSelected(product.id)}
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                      isSelected
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-border bg-white",
                    )}
                  >
                    {isSelected && (
                      <svg className="size-3" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Lender + product name */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                      Lender
                    </p>
                    <p className="font-semibold text-neutral-900">{product.lender}</p>
                    <p className="text-xs text-neutral-500">{product.productName}</p>
                  </div>

                  {/* Metrics grid */}
                  <div className="hidden gap-6 sm:flex">
                    {/* Initial Rate */}
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                        Initial Rate
                      </p>
                      <p className="font-heading text-2xl font-bold tracking-tight text-brand-primary">
                        {product.rate.toFixed(2)}%
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {product.term}-yr {RATE_TYPE_LABELS[product.rateType].toLowerCase()}
                      </p>
                    </div>

                    {/* Max LTV */}
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                        Max LTV
                      </p>
                      <p className="text-xl font-bold text-neutral-900">
                        {product.maxLtv}%
                      </p>
                    </div>

                    {/* Monthly */}
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                        Monthly
                      </p>
                      <p className="text-xl font-bold text-neutral-900">
                        {formatCurrency(product.monthlyPayment)}
                      </p>
                    </div>

                    {/* Product Fee */}
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                        Product Fee
                      </p>
                      <p className="text-xl font-bold text-neutral-900">
                        {product.fees === 0 ? (
                          <span className="text-success">£0</span>
                        ) : (
                          formatCurrency(product.fees)
                        )}
                      </p>
                      {product.fees === 0 && (
                        <p className="text-[10px] text-success">No fee option</p>
                      )}
                    </div>

                    {/* APRC */}
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                        APRC
                      </p>
                      <p className="text-xl font-bold text-neutral-900">
                        {product.aprc.toFixed(1)}%
                      </p>
                      <div className="mt-0.5 flex items-center justify-center gap-0.5">
                        <CheckCircle className="size-3 text-success" />
                        <span className="text-[10px] text-success">Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      aria-label={`View details for ${product.lender} ${product.productName}`}
                      className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-muted hover:text-neutral-600"
                    >
                      <Eye className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile metrics row */}
                <div className="mt-3 grid grid-cols-5 gap-2 border-t border-border pt-3 sm:hidden">
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Rate</p>
                    <p className="text-sm font-bold text-brand-primary">{product.rate.toFixed(2)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">LTV</p>
                    <p className="text-sm font-bold text-neutral-900">{product.maxLtv}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Monthly</p>
                    <p className="text-sm font-bold text-neutral-900">{formatCurrency(product.monthlyPayment)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Fee</p>
                    <p className="text-sm font-bold text-neutral-900">
                      {product.fees === 0 ? "£0" : formatCurrency(product.fees)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">APRC</p>
                    <p className="text-sm font-bold text-neutral-900">{product.aprc.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-border bg-surface px-4 py-16 text-center">
              <p className="text-sm text-neutral-400">
                No products match your filters. Try adjusting your criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Market Trends Analysis + Smart Match Pro */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Market Trends */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <SectionHeader title="Market Trends Analysis" />
          <p className="text-xs leading-relaxed text-neutral-500">
            Average 2-year fixed rates have shown a 0.15% decrease over the last 30 days, primarily driven by improved swap rate stability.
          </p>
          <div className="h-32 rounded-lg bg-muted/50" aria-hidden="true" />
        </div>

        {/* Smart Match Pro */}
        <InsightPanel
          title="Smart Match Pro"
          eyebrow="AI-Powered"
          icon={Sparkles}
          action={{ label: "Run Broker Analysis", href: "#" }}
        >
          Our AI analyses your client&apos;s profile against 14,000+ products to find the optimal Rate fit instantly.
        </InsightPanel>
      </div>
    </div>
  );
}
