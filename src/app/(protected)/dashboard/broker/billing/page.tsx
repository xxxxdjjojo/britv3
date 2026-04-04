
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Crown,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Download,
} from "lucide-react";

const PAYMENT_HISTORY = [
  { id: "1", date: "2026-03-01", description: "Professional Plan - March 2026", amount: 49.99, status: "paid" },
  { id: "2", date: "2026-02-01", description: "Professional Plan - February 2026", amount: 49.99, status: "paid" },
  { id: "3", date: "2026-01-01", description: "Professional Plan - January 2026", amount: 49.99, status: "paid" },
  { id: "4", date: "2025-12-01", description: "Professional Plan - December 2025", amount: 49.99, status: "paid" },
  { id: "5", date: "2025-11-01", description: "Professional Plan - November 2025", amount: 49.99, status: "paid" },
];

const PLANS = [
  {
    name: "Starter",
    price: 19.99,
    features: ["Up to 10 leads/month", "Basic product comparison", "Standard profile", "Email support"],
    current: false,
  },
  {
    name: "Professional",
    price: 49.99,
    features: [
      "Unlimited leads",
      "Full product comparison",
      "Featured profile",
      "Pipeline management",
      "Calculator tools",
      "Priority support",
    ],
    current: true,
  },
  {
    name: "Enterprise",
    price: 99.99,
    features: [
      "Everything in Professional",
      "Team accounts (up to 5)",
      "API access",
      "Custom branding",
      "Dedicated account manager",
      "Advanced analytics",
    ],
    current: false,
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export default function BillingPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Page Header */}
      <div>
        <span className="block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-brand-secondary-dark mb-1">
          Account
        </span>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">Billing</h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Manage your subscription and payment details.
        </p>
      </div>

      {/* Current Plan */}
      <Card className="rounded-xl bg-card shadow-sm ring-1 ring-brand-primary/20 border-0">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-brand-primary-lighter text-brand-primary">
                <Crown className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-base font-semibold text-foreground">Professional Plan</h2>
                  <Badge className="bg-brand-primary text-white font-body text-xs">Current</Badge>
                </div>
                <p className="font-body text-sm text-neutral-500">
                  {formatCurrency(49.99)}/month &middot; Next billing: 1 April 2026
                </p>
              </div>
            </div>
            <Button variant="outline" className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 px-4 py-2 font-body text-sm font-medium text-foreground hover:bg-muted transition-colors shrink-0">
              <CreditCard className="mr-2 size-4" />
              Update Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      <div>
        <h2 className="mb-4 font-heading text-base font-semibold text-foreground">Available Plans</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`rounded-xl bg-card shadow-sm border-0 ${plan.current ? "ring-2 ring-brand-primary shadow-md" : "ring-1 ring-neutral-200/60 dark:ring-neutral-700/60"}`}
            >
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-heading text-base font-semibold text-foreground">{plan.name}</h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-heading text-3xl font-black text-foreground">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="font-body text-sm text-neutral-500">/month</span>
                  </div>
                </div>
                <ul className="mb-6 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 font-body text-sm text-foreground">
                      <CheckCircle2 className="size-4 shrink-0 text-brand-primary mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.current ? (
                  <Button disabled className="w-full rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 px-4 py-2 font-body text-sm font-medium" variant="outline">
                    Current Plan
                  </Button>
                ) : (
                  <Button className="w-full rounded-lg bg-brand-primary px-4 py-2 font-body text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2">
                    {plan.price > 49.99 ? "Upgrade" : "Downgrade"}
                    <ArrowRight className="ml-1.5 size-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
        <div className="flex items-center justify-between border-b border-neutral-100/60 dark:border-neutral-700/60 px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-foreground">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100/60 dark:border-neutral-700/60 bg-muted/40">
                <th className="px-6 py-2.5 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                <th className="px-6 py-2.5 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                <th className="px-6 py-2.5 text-right font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                <th className="px-6 py-2.5 text-center font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="px-6 py-2.5 text-center font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {PAYMENT_HISTORY.map((payment) => (
                <tr key={payment.id} className="border-b border-neutral-100/60 dark:border-neutral-700/60 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3 font-body text-sm text-foreground">
                    {new Date(payment.date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-3 font-body text-sm text-foreground">{payment.description}</td>
                  <td className="px-6 py-3 text-right font-body text-sm font-medium text-foreground">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-medium bg-success-light text-success dark:bg-success/20 dark:text-success">
                      Paid
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <Button variant="ghost" size="sm">
                      <Download className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
