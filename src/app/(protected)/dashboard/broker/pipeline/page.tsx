"use client";

import { useState } from "react";
import { Clock, PoundSterling } from "lucide-react";

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

const STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: "new_lead", label: "New Lead", color: "bg-blue-500" },
  { key: "initial_consultation", label: "Initial Consultation", color: "bg-amber-500" },
  { key: "application_submitted", label: "Application Submitted", color: "bg-purple-500" },
  { key: "underwriting", label: "Underwriting", color: "bg-orange-500" },
  { key: "approved", label: "Approved", color: "bg-emerald-500" },
  { key: "completed", label: "Completed", color: "bg-neutral-400" },
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

  return (
    <div className="rounded-lg bg-card p-3 ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-body text-sm font-medium text-foreground truncate">{client.name}</h4>
        <span className="shrink-0 ml-2 rounded-full bg-brand-primary-lighter px-2 py-0.5 font-body text-xs font-medium text-brand-primary">
          {ltv}% LTV
        </span>
      </div>
      <p className="font-body text-xs text-neutral-500 mb-2">{client.mortgageType}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 font-body text-xs text-neutral-500">
            <PoundSterling className="size-3 text-neutral-400" />
            Property
          </span>
          <span className="font-body text-xs font-medium text-foreground">{formatCurrency(client.propertyValue)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-neutral-500">Loan</span>
          <span className="font-body text-xs font-medium text-foreground">{formatCurrency(client.loanAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-neutral-500">Lender</span>
          <span className="font-body text-xs font-medium text-foreground">{client.lender}</span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-neutral-100/60 dark:border-neutral-700/60 flex items-center gap-1">
        <Clock className="size-3 text-neutral-400" />
        <span className="font-body text-xs text-neutral-400">{client.daysInStage} {client.daysInStage === 1 ? "day" : "days"} in stage</span>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [clients] = useState<PipelineClient[]>(MOCK_CLIENTS);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">Client Pipeline</h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Track your mortgage clients from initial enquiry through to completion.
        </p>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px]">
          {STAGES.map((stage) => {
            const stageClients = clients.filter((c) => c.stage === stage.key);
            return (
              <div key={stage.key} className="flex-1 min-w-[200px] rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 overflow-hidden">
                {/* Column Header */}
                <div className="border-b border-neutral-100/60 dark:border-neutral-700/60 px-4 py-3 flex items-center gap-2">
                  <div className={`size-2 rounded-full ${stage.color}`} />
                  <h3 className="font-heading text-sm font-semibold text-foreground flex-1">{stage.label}</h3>
                  <span className="font-body text-xs text-neutral-400">({stageClients.length})</span>
                </div>

                {/* Column Body */}
                <div className="p-3 min-h-[300px] space-y-3">
                  {stageClients.length === 0 ? (
                    <p className="py-8 text-center font-body text-xs text-neutral-400">No clients</p>
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
