"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

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

const RATE_TYPE_COLORS: Record<RateType, string> = {
  fixed: "bg-blue-50 text-blue-700 border-blue-200",
  variable: "bg-amber-50 text-amber-700 border-amber-200",
  tracker: "bg-purple-50 text-purple-700 border-purple-200",
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

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Mortgage Products</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Compare mortgage products across lenders to find the best deal for your clients.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div>
            <Label htmlFor="product-search" className="text-xs font-medium text-neutral-500">
              Search
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input
                id="product-search"
                placeholder="Lender or product name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Rate Type */}
          <div>
            <Label className="text-xs font-medium text-neutral-500">Rate Type</Label>
            <Select value={rateTypeFilter} onValueChange={(value: string | null) => setRateTypeFilter(value ?? "")}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="variable">Variable</SelectItem>
                <SelectItem value="tracker">Tracker</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max LTV */}
          <div>
            <Label className="text-xs font-medium text-neutral-500">Min LTV Available</Label>
            <Select value={maxLtvFilter} onValueChange={(value: string | null) => setMaxLtvFilter(value ?? "")}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Any LTV" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any LTV</SelectItem>
                <SelectItem value="95">95%+</SelectItem>
                <SelectItem value="90">90%+</SelectItem>
                <SelectItem value="85">85%+</SelectItem>
                <SelectItem value="80">80%+</SelectItem>
                <SelectItem value="75">75%+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Term */}
          <div>
            <Label className="text-xs font-medium text-neutral-500">Term</Label>
            <Select value={termFilter} onValueChange={(value: string | null) => setTermFilter(value ?? "")}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Any term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any term</SelectItem>
                <SelectItem value="2">2 years</SelectItem>
                <SelectItem value="3">3 years</SelectItem>
                <SelectItem value="5">5 years</SelectItem>
                <SelectItem value="10">10 years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-neutral-500">
        Showing <span className="font-semibold text-neutral-900">{filtered.length}</span> products
      </p>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                <th className="px-4 py-3 text-left font-semibold text-neutral-600">Lender</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-600">Product</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-600">Rate</th>
                <th className="px-4 py-3 text-center font-semibold text-neutral-600">Type</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-600">Max LTV</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-600">Fees</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-600">Monthly</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-600">APRC</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-neutral-900">{product.lender}</td>
                  <td className="px-4 py-3 text-neutral-700">{product.productName}</td>
                  <td className="px-4 py-3 text-right font-bold text-[#1B4D3E]">{product.rate.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className={RATE_TYPE_COLORS[product.rateType]}>
                      {RATE_TYPE_LABELS[product.rateType]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-700">{product.maxLtv}%</td>
                  <td className="px-4 py-3 text-right text-neutral-700">
                    {product.fees === 0 ? (
                      <span className="text-emerald-600 font-medium">Free</span>
                    ) : (
                      formatCurrency(product.fees)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                    {formatCurrency(product.monthlyPayment)}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-500">{product.aprc.toFixed(1)}%</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-neutral-400">
                    No products match your filters. Try adjusting your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
