"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
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

const STATUS_CONFIG: Record<VerificationStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  verified: { label: "Verified", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
  pending: { label: "Pending Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: Clock },
  expired: { label: "Expired", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: AlertTriangle },
  not_submitted: { label: "Not Submitted", color: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400", icon: FileText },
};

const MOCK_DOCUMENTS: Document[] = [
  {
    id: "fca-cert",
    name: "FCA Registration Certificate",
    description: "Your Financial Conduct Authority registration certificate confirming authorisation to provide mortgage advice.",
    status: "verified",
    uploadedAt: "2025-11-15",
    expiresAt: "2026-11-15",
  },
  {
    id: "pi-insurance",
    name: "Professional Indemnity Insurance",
    description: "Current PI insurance policy covering mortgage advice activities. Must be renewed annually.",
    status: "pending",
    uploadedAt: "2026-03-10",
  },
  {
    id: "compliance-docs",
    name: "Compliance Documentation",
    description: "TCF (Treating Customers Fairly) policy, complaints procedure, and data protection policy.",
    status: "not_submitted",
  },
  {
    id: "cemap",
    name: "CeMAP Qualification",
    description: "Certificate in Mortgage Advice and Practice or equivalent qualification.",
    status: "verified",
    uploadedAt: "2024-06-20",
  },
];

function StatusBadge({ status }: Readonly<{ status: VerificationStatus }>) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-medium gap-1.5 ${config.color}`}>
      <Icon className="size-3" />
      {config.label}
    </span>
  );
}

export default function FCAVerificationPage() {
  const [fcaNumber, setFcaNumber] = useState("123456");
  const [fcaStatus] = useState<VerificationStatus>("verified");
  const [documents] = useState<Document[]>(MOCK_DOCUMENTS);

  const verifiedCount = documents.filter((d) => d.status === "verified").length;
  const totalCount = documents.length;
  const progressPercent = Math.round((verifiedCount / totalCount) * 100);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <span className="block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-brand-secondary-dark mb-1">
          Profile &amp; Trust
        </span>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">FCA Verification</h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Manage your Financial Conduct Authority registration and compliance documents.
        </p>
      </div>

      {/* FCA Number Card */}
      <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-11 items-center justify-center rounded-lg bg-brand-primary-lighter text-brand-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-base font-semibold text-foreground">FCA Registration</h2>
                <p className="font-body text-sm text-neutral-500">Your FCA firm reference number</p>
              </div>
              <StatusBadge status={fcaStatus} />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1 max-w-xs">
                <Label htmlFor="fca-number" className="font-body text-xs font-medium text-neutral-500">
                  FCA Number
                </Label>
                <Input
                  id="fca-number"
                  value={fcaNumber}
                  onChange={(e) => setFcaNumber(e.target.value)}
                  placeholder="Enter your FCA number"
                  className="mt-1 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card px-3 py-2 font-body text-sm text-foreground focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2"
                />
              </div>
              <Button className="rounded-lg bg-brand-primary px-4 py-2 font-body text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2">
                Verify
              </Button>
            </div>
            <p className="font-body text-xs text-neutral-500">
              Your FCA number is checked against the FCA Register to confirm your authorisation status.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Progress */}
      <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-base font-semibold text-foreground">Document Verification</h2>
          <span className="font-body text-sm font-semibold text-brand-primary">
            {verifiedCount}/{totalCount} verified
          </span>
        </div>
        <div className="space-y-1 mb-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-2 rounded-full bg-brand-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="font-body text-xs text-neutral-500">{progressPercent}% complete</p>
        </div>

        {/* Document List */}
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col gap-4 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-body text-sm font-semibold text-foreground">{doc.name}</h3>
                  <StatusBadge status={doc.status} />
                </div>
                <p className="font-body text-xs text-neutral-500">{doc.description}</p>
                {doc.uploadedAt && (
                  <p className="mt-1 font-body text-xs text-neutral-500">
                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString("en-GB")}
                    {doc.expiresAt && ` \u00B7 Expires: ${new Date(doc.expiresAt).toLocaleDateString("en-GB")}`}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                {doc.status === "not_submitted" || doc.status === "expired" ? (
                  <Button variant="outline" size="sm" className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 px-4 py-2 font-body text-sm font-medium text-foreground hover:bg-muted transition-colors gap-1.5">
                    <Upload className="size-3.5" />
                    Upload
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="gap-1.5 font-body text-sm text-neutral-500">
                    <FileText className="size-3.5" />
                    View
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
