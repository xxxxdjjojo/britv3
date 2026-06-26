"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Users,
  Search,
  SlidersHorizontal,
  Download,
  Mail,
  Briefcase,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

import type { TenantApplication, TenantApplicationStatus } from "@/types/landlord";
import { Button } from "@/components/ui/button";
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger as SheetTriggerBase,
} from "@/components/ui/sheet";

const SheetTrigger = SheetTriggerBase as React.ComponentType<{ asChild?: boolean; children: React.ReactNode }>;
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

// -- Property option (for the add-application selector) ------------------------

export type PortfolioPropertyOption = Readonly<{
  id: string;
  address_line_1: string;
  city: string;
}>;

// -- Status chip config -------------------------------------------------------

const STATUS_CHIP: Record<
  TenantApplicationStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  received: {
    bg: "bg-muted",
    text: "text-neutral-600 dark:text-neutral-300",
    dot: "bg-neutral-400",
    label: "Received",
  },
  shortlisted: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
    label: "Shortlisted",
  },
  referencing: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    label: "Referencing",
  },
  approved: {
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
    label: "Approved",
  },
  rejected: {
    bg: "bg-error/10",
    text: "text-error",
    dot: "bg-error",
    label: "Rejected",
  },
  withdrawn: {
    bg: "bg-muted",
    text: "text-neutral-500 dark:text-neutral-400",
    dot: "bg-neutral-400",
    label: "Withdrawn",
  },
};

// -- Manual add form ----------------------------------------------------------

type AddFormState = {
  property_id: string;
  applicant_name: string;
  applicant_email: string;
  monthly_income: string;
  employment_status: string;
};

const EMPLOYMENT_OPTIONS = [
  "Employed (full-time)",
  "Employed (part-time)",
  "Self-employed",
  "Contractor",
  "Student",
  "Retired",
  "Unemployed",
];

const EMPTY_FORM: AddFormState = {
  property_id: "",
  applicant_name: "",
  applicant_email: "",
  monthly_income: "",
  employment_status: "",
};

function AddApplicationSheet({
  properties,
  onSuccess,
}: Readonly<{ properties: readonly PortfolioPropertyOption[]; onSuccess: () => void }>) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);

  const hasProperties = properties.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.property_id) {
      toast.error("Please choose which property this application is for");
      return;
    }
    if (!form.applicant_name || !form.applicant_email) {
      toast.error("Name and email are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/landlord/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          property_id: form.property_id,
          applicant_name: form.applicant_name,
          applicant_email: form.applicant_email,
          monthly_income: form.monthly_income ? Number(form.monthly_income) : undefined,
          employment_status: form.employment_status || undefined,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Failed to add application");
      }

      toast.success("Application added successfully");
      setOpen(false);
      setForm(EMPTY_FORM);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add application");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-brand-primary text-white hover:bg-brand-primary/90">
          <Plus className="mr-2 size-4" />
          Add Application
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Application</SheetTitle>
        </SheetHeader>
        {!hasProperties ? (
          <div className="mt-6 space-y-4 rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm font-semibold text-foreground">Add a property first</p>
            <p className="text-sm text-muted-foreground">
              Applications belong to a property. Add a rental property to your portfolio, then
              you can screen applicants for it.
            </p>
            <Button asChild className="bg-brand-primary text-white hover:bg-brand-primary/90">
              <Link href="/dashboard/landlord/properties/add">
                <Plus className="mr-2 size-4" />
                Add a property
              </Link>
            </Button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="property_id">
              Which property? <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.property_id}
              onValueChange={(val) => setForm((f) => ({ ...f, property_id: val ?? "" }))}
            >
              <SelectTrigger id="property_id">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.address_line_1}, {p.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicant_name">
              Applicant Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="applicant_name"
              placeholder="Jane Smith"
              value={form.applicant_name}
              onChange={(e) => setForm((f) => ({ ...f, applicant_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicant_email">
              Applicant Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="applicant_email"
              type="email"
              placeholder="jane@example.com"
              value={form.applicant_email}
              onChange={(e) => setForm((f) => ({ ...f, applicant_email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_income">Monthly Income (£)</Label>
            <Input
              id="monthly_income"
              type="number"
              min="0"
              placeholder="3000"
              value={form.monthly_income}
              onChange={(e) => setForm((f) => ({ ...f, monthly_income: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employment_status">Employment Status</Label>
            <Select
              value={form.employment_status}
              onValueChange={(val) => setForm((f) => ({ ...f, employment_status: val ?? "" }))}
            >
              <SelectTrigger id="employment_status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
          >
            {submitting ? "Adding..." : "Add Application"}
          </Button>
        </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

// -- Applicant initials -------------------------------------------------------

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// -- Table row ----------------------------------------------------------------

function ApplicationRow({ application }: Readonly<{ application: TenantApplication }>) {
  const chip = STATUS_CHIP[application.status];
  const initials = getInitials(application.applicant_name);

  return (
    <tr className="border-b border-border hover:bg-surface/60 transition-colors group">
      {/* Applicant */}
      <td className="py-3.5 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <div className="size-9 shrink-0 rounded-full bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{application.applicant_name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{application.applicant_email}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Employment / Income */}
      <td className="hidden md:table-cell py-3.5 px-3">
        {application.employment_status || application.monthly_income != null ? (
          <div className="flex flex-col gap-0.5">
            {application.employment_status && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Briefcase className="size-3 shrink-0" />
                <span className="truncate">{application.employment_status}</span>
              </div>
            )}
            {application.monthly_income != null && (
              <p className="text-xs font-medium text-foreground">
                £{application.monthly_income.toLocaleString("en-GB")}/mo
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Status */}
      <td className="py-3.5 px-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${chip.bg} ${chip.text}`}
        >
          <span className={`size-1.5 rounded-full shrink-0 ${chip.dot}`} />
          {chip.label}
        </span>
      </td>

      {/* Credit check */}
      <td className="hidden lg:table-cell py-3.5 px-3">
        <span className="text-xs text-muted-foreground">
          {application.credit_check_status === "passed"
            ? "✓ Passed"
            : application.credit_check_status === "failed"
              ? "✗ Failed"
              : application.credit_check_status === "pending"
                ? "Pending"
                : "Not run"}
        </span>
      </td>

      {/* References */}
      <td className="hidden lg:table-cell py-3.5 px-3">
        <span className="text-xs text-muted-foreground">
          {application.references_status === "verified"
            ? "✓ Verified"
            : application.references_status === "received"
              ? "Received"
              : "Pending"}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3.5 pl-3 pr-4 text-right">
        <Button asChild variant="outline" size="sm" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/landlord/tenants/${application.id}`}>
            Review
            <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
      </td>
    </tr>
  );
}

// -- Main client component ----------------------------------------------------

type TenantScreeningClientProps = Readonly<{
  initialApplications: TenantApplication[];
  properties?: readonly PortfolioPropertyOption[];
}>;

export function TenantScreeningClient({
  initialApplications,
  properties = [],
}: TenantScreeningClientProps) {
  const router = useRouter();
  // Derived straight from props so router.refresh() (new server data) is
  // reflected immediately. The previous useState froze the first value.
  const applications = initialApplications;

  function byStatus(status: TenantApplicationStatus) {
    return applications.filter((a) => a.status === status);
  }

  const approvedCount = applications.filter((a) => a.status === "approved").length;
  const pendingCount = applications.filter(
    (a) => a.status === "received" || a.status === "shortlisted" || a.status === "referencing",
  ).length;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
            Applications
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark">
            Tenant Screening
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {applications.length} application{applications.length !== 1 ? "s" : ""} across your portfolio
          </p>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>{approvedCount} approved</span>
          </div>
          <AddApplicationSheet properties={properties} onSuccess={() => router.refresh()} />
        </div>
      </div>

      {/* ── Summary stat chips ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total applications */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Total Applications
          </p>
          <p className="mt-1.5 font-heading text-2xl font-bold tracking-tight text-foreground">
            {applications.length}
          </p>
        </div>

        {/* Approved */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Approved
          </p>
          <p className="mt-1.5 font-heading text-2xl font-bold tracking-tight text-success">
            {approvedCount}
          </p>
        </div>

        {/* In progress */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            In Progress
          </p>
          <p className="mt-1.5 font-heading text-2xl font-bold tracking-tight text-warning">
            {pendingCount}
          </p>
        </div>

        {/* Rejected */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Rejected
          </p>
          <p className="mt-1.5 font-heading text-2xl font-bold tracking-tight text-error">
            {byStatus("rejected").length}
          </p>
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search by name, property, or email..."
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            readOnly
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            disabled
          >
            <option>All Statuses</option>
          </select>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:bg-surface/60 transition-colors"
            aria-label="Filter"
          >
            <SlidersHorizontal className="size-4" />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:bg-surface/60 transition-colors"
            aria-label="Download"
          >
            <Download className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Application table ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="size-10 text-muted-foreground/40 mb-3" />
            <p className="font-semibold text-sm text-foreground">No applications</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first application to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="py-3 pl-4 pr-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Applicant
                  </th>
                  <th className="hidden md:table-cell py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Employment
                  </th>
                  <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Status
                  </th>
                  <th className="hidden lg:table-cell py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Credit Check
                  </th>
                  <th className="hidden lg:table-cell py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    References
                  </th>
                  <th className="py-3 pl-3 pr-4 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <ApplicationRow key={app.id} application={app} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination strip */}
        {applications.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing 1–{applications.length} of {applications.length} application{applications.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled
                className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface/60 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-lg bg-brand-primary text-white text-xs font-bold"
                aria-current="page"
              >
                1
              </button>
              <button
                type="button"
                disabled
                className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface/60 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom insight panels ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <InsightPanel
          title="Portfolio Health"
          eyebrow="Overview"
          icon={Activity}
          action={{ label: "Review renewals", href: "/dashboard/landlord/tenants" }}
        >
          Review your active applications and move candidates through the screening pipeline.
        </InsightPanel>

        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-2">
            Pipeline
          </p>
          <h3 className="font-heading text-lg font-bold text-foreground mb-2">
            Pending Applications
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            You have {pendingCount} application{pendingCount !== 1 ? "s" : ""} awaiting review in your screening pipeline.
          </p>
          <Button asChild className="bg-brand-gold text-brand-gold-foreground hover:bg-brand-gold/90 w-fit">
            <Link href="/dashboard/landlord/tenants">
              View Applications
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
