"use client";

import { useState } from "react";

export type MortgageCalculatorProps = Readonly<{
  initialPrice?: number;
  className?: string;
}>;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function MortgageCalculator({
  initialPrice = 0,
  className,
}: MortgageCalculatorProps) {
  const [propertyPrice, setPropertyPrice] = useState(initialPrice);
  const [deposit, setDeposit] = useState(Math.round(initialPrice * 0.1));
  const [termYears, setTermYears] = useState(25);
  const [interestRate, setInterestRate] = useState(4.5);
  const [repaymentType, setRepaymentType] = useState<"repayment" | "interest-only">(
    "repayment",
  );

  const loanAmount = Math.max(0, propertyPrice - deposit);
  const ltv = propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0;

  const monthlyRate = interestRate / 100 / 12;
  const numPayments = termYears * 12;

  let monthlyPayment = 0;
  if (loanAmount > 0 && monthlyRate > 0) {
    if (repaymentType === "repayment") {
      monthlyPayment =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
    } else {
      monthlyPayment = loanAmount * monthlyRate;
    }
  }

  const totalRepayable =
    repaymentType === "repayment"
      ? monthlyPayment * numPayments
      : monthlyPayment * numPayments + loanAmount;

  const totalInterest = totalRepayable - loanAmount;

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Property price */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Property price
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              £
            </span>
            <input
              type="number"
              min={0}
              step={1000}
              value={propertyPrice}
              onChange={(e) => setPropertyPrice(Number(e.target.value))}
              className="block w-full rounded-lg border border-neutral-300 py-2 pl-7 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Deposit */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Deposit
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              £
            </span>
            <input
              type="number"
              min={0}
              step={1000}
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
              className="block w-full rounded-lg border border-neutral-300 py-2 pl-7 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          {propertyPrice > 0 && (
            <p className="mt-1 text-xs text-neutral-500">
              {ltv.toFixed(1)}% LTV — loan of {formatCurrency(loanAmount)}
            </p>
          )}
        </div>

        {/* Term */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Mortgage term: {termYears} years
          </label>
          <input
            type="range"
            min={5}
            max={40}
            step={1}
            value={termYears}
            onChange={(e) => setTermYears(Number(e.target.value))}
            className="mt-1 w-full accent-primary-600"
          />
          <div className="flex justify-between text-xs text-neutral-400">
            <span>5 yrs</span>
            <span>40 yrs</span>
          </div>
        </div>

        {/* Interest rate */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Interest rate: {interestRate.toFixed(2)}%
          </label>
          <input
            type="range"
            min={0.5}
            max={15}
            step={0.05}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="mt-1 w-full accent-primary-600"
          />
          <div className="flex justify-between text-xs text-neutral-400">
            <span>0.50%</span>
            <span>15.00%</span>
          </div>
        </div>

        {/* Repayment type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Repayment type
          </label>
          <div className="mt-1 flex gap-2">
            {(["repayment", "interest-only"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setRepaymentType(type)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  repaymentType === type
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
                }`}
              >
                {type === "repayment" ? "Repayment" : "Interest only"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {loanAmount > 0 && monthlyPayment > 0 && (
        <div className="mt-5 rounded-xl bg-primary-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
            Estimated monthly payment
          </p>
          <p className="mt-1 text-3xl font-bold text-primary-900">
            {formatCurrency(monthlyPayment)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-neutral-500">Total repayable</p>
              <p className="font-semibold text-neutral-800">
                {formatCurrency(totalRepayable)}
              </p>
            </div>
            <div>
              <p className="text-neutral-500">Total interest</p>
              <p className="font-semibold text-neutral-800">
                {formatCurrency(totalInterest)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            Indicative only. Actual rates depend on your credit profile and chosen lender.
          </p>
        </div>
      )}
    </div>
  );
}
