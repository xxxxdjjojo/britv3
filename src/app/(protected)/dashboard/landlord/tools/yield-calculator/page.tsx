"use client";

/**
 * 9.28 Yield Calculator — real-time gross/net yield calculation from landlord inputs.
 * Pure client-side calculation using calculateYield (no Supabase query for core logic).
 */

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { calculateYield } from "@/lib/yield-calculator";

const schema = z.object({
  propertyValue: z.coerce.number().min(0, "Property value must be 0 or more"),
  monthlyRent: z.coerce.number().min(0, "Monthly rent must be 0 or more"),
  monthlyManagementFee: z.coerce.number().min(0).default(0),
  monthlyMaintenance: z.coerce.number().min(0).default(0),
  monthlyInsurance: z.coerce.number().min(0).default(0),
  monthlyMortgage: z.coerce.number().min(0).default(0),
});

type FormData = z.infer<typeof schema>;

function yieldColour(yieldPct: number): string {
  if (yieldPct >= 5) return "text-green-700";
  if (yieldPct >= 3) return "text-amber-600";
  return "text-red-600";
}

type FieldProps = Readonly<{
  label: string;
  name: keyof FormData;
  hint?: string;
  register: ReturnType<typeof useForm<FormData>>["register"];
  error?: string;
}>;

function MoneyField({ label, name, hint, register, error }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      <div className="relative mt-1">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          £
        </span>
        <input
          type="number"
          step="1"
          min="0"
          {...register(name)}
          className="block w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          placeholder="0"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function YieldCalculatorPage() {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      propertyValue: 0,
      monthlyRent: 0,
      monthlyManagementFee: 0,
      monthlyMaintenance: 0,
      monthlyInsurance: 0,
      monthlyMortgage: 0,
    },
  });

  const values = watch();
  const result = calculateYield({
    propertyValue: values.propertyValue ?? 0,
    monthlyRent: values.monthlyRent ?? 0,
    monthlyManagementFee: values.monthlyManagementFee ?? 0,
    monthlyMaintenance: values.monthlyMaintenance ?? 0,
    monthlyInsurance: values.monthlyInsurance ?? 0,
    monthlyMortgage: values.monthlyMortgage ?? 0,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Yield Calculator</h1>
        <p className="mt-1 text-sm text-gray-500">
          Calculate your gross and net rental yield in real-time. Results update
          as you type.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input form */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Property Details
          </h2>
          <div className="space-y-4">
            <MoneyField
              label="Property Value"
              name="propertyValue"
              hint="Purchase price or current market value"
              register={register}
              error={errors.propertyValue?.message}
            />
            <MoneyField
              label="Monthly Rent"
              name="monthlyRent"
              register={register}
              error={errors.monthlyRent?.message}
            />
          </div>

          <h2 className="mb-4 mt-6 text-base font-semibold text-gray-900">
            Monthly Costs
          </h2>
          <div className="space-y-4">
            <MoneyField
              label="Management Fee"
              name="monthlyManagementFee"
              hint="Typically 8–12% of monthly rent if using a letting agent"
              register={register}
              error={errors.monthlyManagementFee?.message}
            />
            <MoneyField
              label="Maintenance Reserve"
              name="monthlyMaintenance"
              hint="Suggested: 1% of property value ÷ 12"
              register={register}
              error={errors.monthlyMaintenance?.message}
            />
            <MoneyField
              label="Insurance"
              name="monthlyInsurance"
              register={register}
              error={errors.monthlyInsurance?.message}
            />
            <MoneyField
              label="Mortgage Interest"
              name="monthlyMortgage"
              hint="Interest-only portion for accurate net yield"
              register={register}
              error={errors.monthlyMortgage?.message}
            />
          </div>
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {/* Headline yields */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Results
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-surface p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Gross Yield
                </p>
                <p
                  className={`mt-1 text-3xl font-bold ${yieldColour(result.grossYield)}`}
                >
                  {result.grossYield}%
                </p>
              </div>
              <div className="rounded-lg bg-surface p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Net Yield
                </p>
                <p
                  className={`mt-1 text-3xl font-bold ${yieldColour(result.netYield)}`}
                >
                  {result.netYield}%
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Annual Income</span>
                <span className="font-medium text-gray-900">
                  £{result.annualRent.toLocaleString("en-GB")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Annual Costs</span>
                <span className="font-medium text-gray-900">
                  £{result.annualCosts.toLocaleString("en-GB")}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-sm">
                <span className="font-medium text-gray-700">Annual Profit</span>
                <span
                  className={`font-bold ${result.annualNet >= 0 ? "text-green-700" : "text-red-600"}`}
                >
                  £{result.annualNet.toLocaleString("en-GB")}
                </span>
              </div>
            </div>
          </div>

          {/* UK benchmark info panel */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="mb-1 text-sm font-semibold text-amber-900">
              UK Benchmarks (2025)
            </h3>
            <ul className="space-y-1 text-xs text-amber-800">
              <li>Average UK gross yield: 5.8%</li>
              <li>Average UK net yield: 3.2–4.5% (varies by market)</li>
              <li>
                <span className="font-medium text-green-700">≥5% gross</span>
                {" — "}strong
              </li>
              <li>
                <span className="font-medium text-amber-600">3–5% gross</span>
                {" — "}moderate
              </li>
              <li>
                <span className="font-medium text-red-600">&lt;3% gross</span>
                {" — "}consider strategy review
              </li>
            </ul>
            <p className="mt-2 text-xs text-amber-700">
              Your target yield varies by strategy (capital growth vs. income
              focus) and market conditions.
            </p>
          </div>

          {/* Yield colour legend */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-500">
            <p className="font-medium text-gray-700">Colour guide</p>
            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-700">Green</span> — ≥5%
                (strong)
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-600">Amber</span> — 3–5%
                (moderate)
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-600">Red</span> — &lt;3%
                (low)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
