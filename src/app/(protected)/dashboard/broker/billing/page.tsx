"use client";

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
        <h1 className="text-2xl font-bold text-neutral-900">Billing</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your subscription and payment details.
        </p>
      </div>

      {/* Current Plan */}
      <Card className="border-[#1B4D3E]/20">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-[#E8F5EE] text-[#1B4D3E]">
                <Crown className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900">Professional Plan</h2>
                  <Badge className="bg-[#1B4D3E] text-white">Current</Badge>
                </div>
                <p className="text-sm text-neutral-500">
                  {formatCurrency(49.99)}/month &middot; Next billing: 1 April 2026
                </p>
              </div>
            </div>
            <Button variant="outline" className="shrink-0">
              <CreditCard className="mr-2 size-4" />
              Update Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Available Plans</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={plan.current ? "border-2 border-[#1B4D3E] shadow-md" : ""}
            >
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-neutral-900">{plan.name}</h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-neutral-900">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-sm text-neutral-500">/month</span>
                  </div>
                </div>
                <ul className="mb-6 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-neutral-600">
                      <CheckCircle2 className="size-4 shrink-0 text-[#1B4D3E] mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.current ? (
                  <Button disabled className="w-full" variant="outline">
                    Current Plan
                  </Button>
                ) : (
                  <Button className="w-full bg-[#1B4D3E] text-white hover:bg-[#163d31]">
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
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="px-6 py-2.5 text-left font-semibold text-neutral-600">Date</th>
                <th className="px-6 py-2.5 text-left font-semibold text-neutral-600">Description</th>
                <th className="px-6 py-2.5 text-right font-semibold text-neutral-600">Amount</th>
                <th className="px-6 py-2.5 text-center font-semibold text-neutral-600">Status</th>
                <th className="px-6 py-2.5 text-center font-semibold text-neutral-600">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {PAYMENT_HISTORY.map((payment) => (
                <tr key={payment.id} className="border-b border-neutral-100">
                  <td className="px-6 py-3 text-neutral-700">
                    {new Date(payment.date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-3 text-neutral-700">{payment.description}</td>
                  <td className="px-6 py-3 text-right font-medium text-neutral-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Paid
                    </Badge>
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
