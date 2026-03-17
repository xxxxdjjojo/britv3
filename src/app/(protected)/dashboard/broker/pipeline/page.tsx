"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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

const STAGES: { key: PipelineStage; label: string; color: string; bgColor: string }[] = [
  { key: "new_lead", label: "New Lead", color: "bg-blue-500", bgColor: "bg-blue-50 border-blue-200" },
  { key: "initial_consultation", label: "Initial Consultation", color: "bg-amber-500", bgColor: "bg-amber-50 border-amber-200" },
  { key: "application_submitted", label: "Application Submitted", color: "bg-purple-500", bgColor: "bg-purple-50 border-purple-200" },
  { key: "underwriting", label: "Underwriting", color: "bg-orange-500", bgColor: "bg-orange-50 border-orange-200" },
  { key: "approved", label: "Approved", color: "bg-emerald-500", bgColor: "bg-emerald-50 border-emerald-200" },
  { key: "completed", label: "Completed", color: "bg-neutral-400", bgColor: "bg-neutral-50 border-neutral-200" },
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
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-neutral-900 truncate">{client.name}</h4>
        <Badge variant="outline" className="shrink-0 text-[10px] ml-2">
          {ltv}% LTV
        </Badge>
      </div>
      <p className="text-xs text-neutral-500 mb-2">{client.mortgageType}</p>
      <div className="space-y-1 text-xs text-neutral-600">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <PoundSterling className="size-3 text-neutral-400" />
            Property
          </span>
          <span className="font-medium">{formatCurrency(client.propertyValue)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Loan</span>
          <span className="font-medium">{formatCurrency(client.loanAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Lender</span>
          <span className="font-medium">{client.lender}</span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center gap-1 text-xs text-neutral-400">
        <Clock className="size-3" />
        <span>{client.daysInStage} {client.daysInStage === 1 ? "day" : "days"} in stage</span>
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
        <h1 className="text-2xl font-bold text-neutral-900">Client Pipeline</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Track your mortgage clients from initial enquiry through to completion.
        </p>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px]">
          {STAGES.map((stage) => {
            const stageClients = clients.filter((c) => c.stage === stage.key);
            return (
              <div key={stage.key} className="flex-1 min-w-[200px]">
                {/* Column Header */}
                <div className={`rounded-t-lg border px-3 py-2 ${stage.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`size-2.5 rounded-full ${stage.color}`} />
                      <h3 className="text-xs font-semibold text-neutral-700">{stage.label}</h3>
                    </div>
                    <span className="text-xs font-bold text-neutral-500">{stageClients.length}</span>
                  </div>
                </div>

                {/* Column Body */}
                <div className="rounded-b-lg border border-t-0 border-neutral-200 bg-neutral-50/50 p-2 min-h-[300px] space-y-2">
                  {stageClients.length === 0 ? (
                    <p className="py-8 text-center text-xs text-neutral-400">No clients</p>
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
