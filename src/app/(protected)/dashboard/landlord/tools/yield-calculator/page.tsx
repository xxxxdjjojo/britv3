"use client";

/**
 * 9.28 Yield Calculator — real-time gross/net yield calculation from landlord inputs.
 * Pure client-side calculation using calculateYield (no Supabase query for core logic).
 */

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { calculateYield } from "@/lib/yield-calculator";
import { TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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
  if (yieldPct >= 5) return "text-emerald-700 dark:text-emerald-400";
  if (yieldPct >= 3) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function yieldBg(yieldPct: number): string {
  if (yieldPct >= 5) return "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800";
  if (yieldPct >= 3) return "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800";
  return "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800";
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
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
      </label>
      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm font-medium">
          £
        </span>
        <input
          type="number"
          step="1"
          min="0"
          {...register(name)}
          className="block w-full rounded-lg border border-input bg-background py-2.5 pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          placeholder="0"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
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
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <TrendingUp className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Yield Calculator
          </h1>
          <p className="text-sm text-muted-foreground">
            Calculate your gross and net rental yield in real-time. Results update as you type.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input form */}
        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              Property Details
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Enter the current property value and expected rent
            </p>
          </div>
          <div className="flex flex-col gap-4">
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

          <div className="border-t border-border pt-4">
            <h2 className="font-heading text-base font-semibold text-foreground">
              Monthly Costs
            </h2>
            <p className="mt-0.5 mb-4 text-xs text-muted-foreground">
              Include all regular outgoings for an accurate net yield
            </p>
            <div className="flex flex-col gap-4">
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
        </div>

        {/* Results panel */}
        <div className="flex flex-col gap-4">
          {/* Headline yields */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-foreground mb-4">
              Results
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className={cn("rounded-xl border p-4 text-center", yieldBg(result.grossYield))}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Gross Yield
                </p>
                <p className={cn("mt-1 text-4xl font-bold font-heading", yieldColour(result.grossYield))}>
                  {result.grossYield}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">before costs</p>
              </div>
              <div className={cn("rounded-xl border p-4 text-center", yieldBg(result.netYield))}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Net Yield
                </p>
                <p className={cn("mt-1 text-4xl font-bold font-heading", yieldColour(result.netYield))}>
                  {result.netYield}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">after costs</p>
              </div>
            </div>

            <div className="mt-5 space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Annual Income</span>
                <span className="font-semibold text-foreground">
                  £{result.annualRent.toLocaleString("en-GB")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Annual Costs</span>
                <span className="font-semibold text-foreground">
                  £{result.annualCosts.toLocaleString("en-GB")}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
                <span className="font-medium text-foreground">Annual Profit</span>
                <span
                  className={cn(
                    "font-bold",
                    result.annualNet >= 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-destructive",
                  )}
                >
                  £{result.annualNet.toLocaleString("en-GB")}
                </span>
              </div>
            </div>
          </div>

          {/* Yield bar visualisation */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Performance Rating
            </h3>
            <div className="space-y-3">
              {[
                { label: "Strong (≥5%)", threshold: 5, colour: "bg-emerald-500" },
                { label: "Moderate (3–5%)", threshold: 3, colour: "bg-amber-500" },
                { label: "Low (<3%)", threshold: 0, colour: "bg-red-500" },
              ].map((tier) => (
                <div key={tier.label} className="flex items-center gap-3 text-xs">
                  <div className={cn("size-2.5 rounded-full shrink-0", tier.colour)} />
                  <span className="text-muted-foreground flex-1">{tier.label}</span>
                  {result.grossYield >= tier.threshold &&
                    (tier.threshold === 5 ||
                      (tier.threshold === 3 && result.grossYield < 5) ||
                      (tier.threshold === 0 && result.grossYield < 3)) && (
                      <span className="font-medium text-foreground">← your yield</span>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* UK benchmark info panel */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="flex items-start gap-2.5">
              <Info className="size-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1.5">
                  UK Benchmarks (2025)
                </h3>
                <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-400">
                  <li>Average UK gross yield: 5.8%</li>
                  <li>Average UK net yield: 3.2–4.5%</li>
                  <li>Target varies by strategy and market</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
