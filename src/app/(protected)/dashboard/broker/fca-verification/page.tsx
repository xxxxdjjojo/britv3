"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Lock,
  ArrowLeft,
} from "lucide-react";

type VerificationStatus = "pending" | "verified" | "expired" | "not_submitted";

type Document = {
  id: string;
  name: string;
  description: string;
  status: VerificationStatus;
  uploadedAt?: string;
  expiresAt?: string;
};

const STATUS_CONFIG: Record<
  VerificationStatus,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  verified: {
    label: "Verified",
    color: "bg-success/10 text-success border-success/20",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending Review",
    color: "bg-warning/10 text-warning border-warning/20",
    icon: Clock,
  },
  expired: {
    label: "Expired",
    color: "bg-error/10 text-error border-error/20",
    icon: AlertTriangle,
  },
  not_submitted: {
    label: "Not Submitted",
    color: "bg-muted text-neutral-500 border-border",
    icon: FileText,
  },
};

const MOCK_DOCUMENTS: Document[] = [
  {
    id: "fca-cert",
    name: "FCA Registration Certificate",
    description:
      "Your Financial Conduct Authority registration certificate confirming authorisation to provide mortgage advice.",
    status: "verified",
    uploadedAt: "2025-11-15",
    expiresAt: "2026-11-15",
  },
  {
    id: "pi-insurance",
    name: "Professional Indemnity Insurance",
    description:
      "Current PI insurance policy covering mortgage advice activities. Must be renewed annually.",
    status: "pending",
    uploadedAt: "2026-03-10",
  },
  {
    id: "compliance-docs",
    name: "Compliance Documentation",
    description:
      "TCF (Treating Customers Fairly) policy, complaints procedure, and data protection policy.",
    status: "not_submitted",
  },
  {
    id: "cemap",
    name: "CeMAP Qualification",
    description:
      "Certificate in Mortgage Advice and Practice or equivalent qualification.",
    status: "verified",
    uploadedAt: "2024-06-20",
  },
];

// Verification steps for the left-column stepper
const VERIFICATION_STEPS = [
  {
    id: "fca-number",
    label: "FCA Number",
    description: "Validated via Financial Services Register",
    status: "verified" as VerificationStatus,
  },
  {
    id: "indemnity",
    label: "Indemnity Insurance",
    description: "Document uploaded and in queue",
    status: "pending" as VerificationStatus,
  },
  {
    id: "trading-name",
    label: "Trading Name",
    description: "Confirm your business identity",
    status: "not_submitted" as VerificationStatus,
  },
];

function StatusBadge({ status }: Readonly<{ status: VerificationStatus }>) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.color} gap-1.5`}>
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}

function StepIcon({ status }: Readonly<{ status: VerificationStatus }>) {
  if (status === "verified") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="size-4 text-success" />
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warning/10">
        <Clock className="size-4 text-warning" />
      </span>
    );
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted">
      <span className="size-2 rounded-full bg-neutral-300" />
    </span>
  );
}

export default function FCAVerificationPage() {
  const [fcaNumber, setFcaNumber] = useState("123456");
  const [fcaStatus] = useState<VerificationStatus>("verified");
  const [documents] = useState<Document[]>(MOCK_DOCUMENTS);
  const [tradingName, setTradingName] = useState(
    "Sterling & Partners Financial Ltd",
  );

  const verifiedCount = documents.filter((d) => d.status === "verified").length;
  const totalCount = documents.length;
  const progressPercent = Math.round((verifiedCount / totalCount) * 100);

  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
        <span>Compliance</span>
        <ChevronRight className="size-3" />
        <span>Verification Flow</span>
      </nav>

      {/* Page header — editorial style */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            FCA Registration
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
            FCA Registration
          </h1>
        </div>
        {/* Status banner */}
        <div className="mt-1 flex shrink-0 flex-col items-end gap-0.5">
          <Badge
            variant="outline"
            className="gap-1.5 border-warning/30 bg-warning/10 text-warning"
          >
            <Clock className="size-3" />
            Awaiting Document Review
          </Badge>
          <span className="text-[11px] text-neutral-400">
            Submitted on Oct 20, 2023
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* ── Left col: stepper + insight panel ── */}
        <div className="flex flex-col gap-4">
          {/* Verification Steps */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Verification Steps
            </p>
            <ol className="flex flex-col gap-4">
              {VERIFICATION_STEPS.map((step) => (
                <li key={step.id} className="flex items-start gap-3">
                  <StepIcon status={step.status} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">
                      {step.label}
                    </p>
                    <p className="text-xs leading-snug text-neutral-400">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Insight panel */}
          <InsightPanel title="Compliance Standards">
            We strictly adhere to the FCA&apos;s Handbook regulations for credit
            brokers. Your data is encrypted and handled according to GDPR
            standards.
          </InsightPanel>
        </div>

        {/* ── Right col: action card + info tiles ── */}
        <div className="flex flex-col gap-4">
          {/* Main action card */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            {/* Step counter */}
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-primary">
              Step 3 of 3 &nbsp;·&nbsp; Action Required
            </p>
            <h2 className="font-heading text-xl font-bold tracking-tight text-brand-primary-dark">
              Confirm Trading Identity
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Ensure your trading name matches exactly with your FCA registration
              to avoid processing delays.
            </p>

            {/* Trading name field */}
            <div className="mt-5">
              <Label htmlFor="trading-name" className="text-sm font-semibold">
                Primary Trading Name
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="trading-name"
                  value={tradingName}
                  onChange={(e) => setTradingName(e.target.value)}
                  className="pr-28"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-success">
                  Matches FCA ✓
                </span>
              </div>
            </div>

            {/* Summary fields */}
            <div className="mt-5 grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/40 p-4">
              {/* FCA PIN */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                  FCA PIN
                </p>
                <p className="mt-0.5 font-heading text-lg font-bold text-neutral-900">
                  {fcaNumber}
                </p>
              </div>
              {/* PI Insurance */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                  P.Insurance
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <FileText className="size-4 text-brand-primary" />
                  <span className="text-sm font-medium text-neutral-700">
                    policy_2024.pdf
                  </span>
                </div>
              </div>
            </div>

            {/* FCA number + status row (preserves existing verify functionality) */}
            <div className="mt-5 flex items-end gap-3 border-t border-border pt-5">
              <div className="flex-1 max-w-xs">
                <Label htmlFor="fca-number" className="text-sm font-medium">
                  FCA Number
                </Label>
                <Input
                  id="fca-number"
                  value={fcaNumber}
                  onChange={(e) => setFcaNumber(e.target.value)}
                  placeholder="Enter your FCA number"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-neutral-400">
                  Your FCA number is checked against the FCA Register to confirm your authorisation status.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={fcaStatus} />
                <Button className="bg-brand-primary text-white hover:bg-brand-primary-dark">
                  Verify
                </Button>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" size="sm" className="gap-1.5 text-neutral-500">
                <ArrowLeft className="size-4" />
                Back to Uploads
              </Button>
              <Button className="gap-2 bg-brand-primary text-white hover:bg-brand-primary-dark">
                Complete Verification
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Document progress (preserves the doc list) */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">
                Document Verification
              </p>
              <span className="text-sm font-semibold text-brand-primary">
                {verifiedCount}/{totalCount} verified
              </span>
            </div>
            <div className="space-y-1 mb-5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-brand-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-neutral-400">{progressPercent}% complete</p>
            </div>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-neutral-900">
                        {doc.name}
                      </h3>
                      <StatusBadge status={doc.status} />
                    </div>
                    <p className="text-xs text-neutral-500">{doc.description}</p>
                    {doc.uploadedAt && (
                      <p className="mt-1 text-xs text-neutral-400">
                        Uploaded:{" "}
                        {new Date(doc.uploadedAt).toLocaleDateString("en-GB")}
                        {doc.expiresAt &&
                          ` · Expires: ${new Date(doc.expiresAt).toLocaleDateString("en-GB")}`}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {doc.status === "not_submitted" ||
                    doc.status === "expired" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                      >
                        <Upload className="size-3.5" />
                        Upload
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-neutral-500"
                      >
                        <FileText className="size-3.5" />
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom info tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Review Timeline */}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
                <Clock className="size-4 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Review Timeline
                </p>
                <p className="mt-0.5 text-xs leading-snug text-neutral-500">
                  Manual reviews typically take 24–48 business hours.
                  We&apos;ll notify you via email.
                </p>
              </div>
            </div>

            {/* Bank-grade Security */}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
                <Lock className="size-4 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Bank-grade Security
                </p>
                <p className="mt-0.5 text-xs leading-snug text-neutral-500">
                  Your professional documents are stored in an AES-256
                  encrypted vault.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
