"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Filter, Plus, PoundSterling } from "lucide-react";

type PipelineStage =
  | "new_lead"
  | "initial_consultation"
  | "application_submitted"
  | "underwriting"
  | "approved"
  | "completed";

type PipelineClient = {
  id: string;
  name: string;
  propertyValue: number;
  loanAmount: number;
  lender: string;
  stage: PipelineStage;
  daysInStage: number;
  mortgageType: string;
};

const STAGES: {
  key: PipelineStage;
  label: string;
  dotColor: string;
  headerBg: string;
  headerBorder: string;
}[] = [
  {
    key: "new_lead",
    label: "New Lead",
    dotColor: "bg-blue-500",
    headerBg: "bg-blue-50",
    headerBorder: "border-blue-200",
  },
  {
    key: "initial_consultation",
    label: "Initial Consultation",
    dotColor: "bg-amber-500",
    headerBg: "bg-amber-50",
    headerBorder: "border-amber-200",
  },
  {
    key: "application_submitted",
    label: "Application Submitted",
    dotColor: "bg-violet-500",
    headerBg: "bg-violet-50",
    headerBorder: "border-violet-200",
  },
  {
    key: "underwriting",
    label: "Underwriting",
    dotColor: "bg-orange-500",
    headerBg: "bg-orange-50",
    headerBorder: "border-orange-200",
  },
  {
    key: "approved",
    label: "Approved",
    dotColor: "bg-emerald-500",
    headerBg: "bg-emerald-50",
    headerBorder: "border-emerald-200",
  },
  {
    key: "completed",
    label: "Completed",
    dotColor: "bg-neutral-400",
    headerBg: "bg-surface",
    headerBorder: "border-neutral-200",
  },
];

const MOCK_CLIENTS: PipelineClient[] = [
  {
    id: "1",
    name: "Sarah Thompson",
    propertyValue: 425000,
    loanAmount: 340000,
    lender: "Natwest",
    stage: "new_lead",
    daysInStage: 1,
    mortgageType: "First-time buyer",
  },
  {
    id: "2",
    name: "Michael Chen",
    propertyValue: 550000,
    loanAmount: 412500,
    lender: "HSBC",
    stage: "new_lead",
    daysInStage: 3,
    mortgageType: "Remortgage",
  },
  {
    id: "3",
    name: "James & Claire Reed",
    propertyValue: 375000,
    loanAmount: 300000,
    lender: "Barclays",
    stage: "initial_consultation",
    daysInStage: 5,
    mortgageType: "First-time buyer",
  },
  {
    id: "4",
    name: "Priya Patel",
    propertyValue: 280000,
    loanAmount: 252000,
    lender: "Halifax",
    stage: "application_submitted",
    daysInStage: 8,
    mortgageType: "Buy-to-let",
  },
  {
    id: "5",
    name: "David Collins",
    propertyValue: 620000,
    loanAmount: 434000,
    lender: "Nationwide",
    stage: "underwriting",
    daysInStage: 12,
    mortgageType: "Remortgage",
  },
  {
    id: "6",
    name: "Emma Wilson",
    propertyValue: 315000,
    loanAmount: 283500,
    lender: "Santander",
    stage: "approved",
    daysInStage: 2,
    mortgageType: "First-time buyer",
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

function ClientCard({ client }: Readonly<{ client: PipelineClient }>) {
  const ltv = Math.round((client.loanAmount / client.propertyValue) * 100);
  const isNew = client.daysInStage <= 1;

  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer">
      {/* Card header: name + NEW badge or LTV */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="text-sm font-semibold text-neutral-900 leading-tight">
          {client.name}
        </h4>
        {isNew ? (
          <span className="shrink-0 rounded-full bg-brand-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-gold-foreground">
            NEW
          </span>
        ) : (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {ltv}% LTV
          </Badge>
        )}
      </div>

      {/* Mortgage type */}
      <p className="text-[11px] text-neutral-400 mb-3">{client.mortgageType}</p>

      {/* Key details */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-neutral-500">
            <PoundSterling className="size-3 text-neutral-400" />
            Property
          </span>
          <span className="font-semibold text-neutral-800">
            {formatCurrency(client.propertyValue)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Loan</span>
          <span className="font-semibold text-neutral-800">
            {formatCurrency(client.loanAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Lender</span>
          <span className="font-semibold text-neutral-800">{client.lender}</span>
        </div>
      </div>

      {/* Footer: days in stage */}
      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] text-neutral-400">
        <Clock className="size-3" />
        <span>
          {client.daysInStage} {client.daysInStage === 1 ? "day" : "days"} in stage
        </span>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [clients] = useState<PipelineClient[]>(MOCK_CLIENTS);

  // Summary stats derived from data
  const totalVolume = clients.reduce((sum, c) => sum + c.loanAmount, 0);
  const activeCases = clients.filter((c) => c.stage !== "completed").length;

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
            Active Portfolios
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
            Client Pipeline
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Track your mortgage clients from initial enquiry through to completion.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="size-3.5" />
            Filter View
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-brand-primary text-white hover:bg-brand-primary-dark"
          >
            <Plus className="size-3.5" />
            New Application
          </Button>
        </div>
      </div>

      {/* Summary stat pills */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="text-neutral-600">
          <span className="font-bold text-neutral-900">
            {formatCurrency(totalVolume)}
          </span>{" "}
          Total Volume
        </span>
        <span className="text-neutral-400" aria-hidden>·</span>
        <span className="text-neutral-600">
          <span className="font-bold text-neutral-900">{activeCases}</span>{" "}
          Active Cases
        </span>
        <span className="text-neutral-400" aria-hidden>·</span>
        <span className="text-neutral-600">
          <span className="font-bold text-neutral-900">
            {clients.filter((c) => c.stage === "completed").length}
          </span>{" "}
          Completed
        </span>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto snap-x snap-mandatory lg:snap-none pb-4 -mx-6 px-6">
        <div className="flex gap-3">
          {STAGES.map((stage) => {
            const stageClients = clients.filter((c) => c.stage === stage.key);
            return (
              <div key={stage.key} className="snap-start shrink-0 w-[80%] sm:w-[45%] lg:w-auto lg:flex-1 flex flex-col">
                {/* Column header */}
                <div
                  className={`flex items-center justify-between rounded-t-xl border px-3 py-2.5 ${stage.headerBg} ${stage.headerBorder}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${stage.dotColor}`} />
                    <span className="text-xs font-semibold text-neutral-700">
                      {stage.label}
                    </span>
                  </div>
                  <span className="flex size-5 items-center justify-center rounded-full bg-white/80 text-[10px] font-bold text-neutral-600 border border-neutral-200/60">
                    {stageClients.length}
                  </span>
                </div>

                {/* Column body */}
                <div className="flex-1 rounded-b-xl border border-t-0 border-border bg-neutral-100/60 p-2 min-h-[320px] space-y-2">
                  {stageClients.length === 0 ? (
                    <p className="py-10 text-center text-xs text-neutral-400">
                      No clients
                    </p>
                  ) : (
                    stageClients.map((client) => (
                      <ClientCard key={client.id} client={client} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
