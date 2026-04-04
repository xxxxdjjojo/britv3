"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Users,
  Filter,
  Search,
  LayoutGrid,
  List,
  ArrowRight,
  Mail,
  Briefcase,
  PoundSterling,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import type { TenantApplication, TenantApplicationStatus } from "@/types/landlord";
import { ApplicationPipelineCard } from "@/components/landlord/ApplicationPipelineCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { createClient } from "@/lib/supabase/client";
import { STATUS_STYLES } from "@/lib/tenant-status-styles";

// -- Kanban column config -----------------------------------------------------

type KanbanColumn = {
  status: TenantApplicationStatus;
  label: string;
  headerClass: string;
  countClass: string;
  dotClass: string;
};

const COLUMNS: KanbanColumn[] = [
  {
    status: "received",
    label: "Received",
    headerClass: "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700",
    countClass: "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300",
    dotClass: "bg-neutral-400",
  },
  {
    status: "shortlisted",
    label: "Shortlisted",
    headerClass: "bg-brand-accent/5 dark:bg-brand-accent/10 border-brand-accent/20 dark:border-brand-accent/20",
    countClass: "bg-brand-accent/10 dark:bg-brand-accent/20 text-brand-accent dark:text-brand-accent",
    dotClass: "bg-brand-accent",
  },
  {
    status: "referencing",
    label: "Referencing",
    headerClass: "bg-warning-light dark:bg-warning/10 border-warning/30 dark:border-warning/20",
    countClass: "bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning",
    dotClass: "bg-warning",
  },
  {
    status: "approved",
    label: "Approved",
    headerClass: "bg-success-light dark:bg-success/10 border-success/30 dark:border-success/20",
    countClass: "bg-success/10 dark:bg-success/20 text-success dark:text-success",
    dotClass: "bg-success",
  },
  {
    status: "rejected",
    label: "Rejected",
    headerClass: "bg-error-light dark:bg-error/10 border-error/30 dark:border-error/20",
    countClass: "bg-error/10 dark:bg-error/20 text-error dark:text-error",
    dotClass: "bg-error",
  },
];

// STATUS_STYLES is imported from @/lib/tenant-status-styles (shared with ApplicationPipelineCard)

// Active statuses (pipeline in progress)
const ACTIVE_STATUSES: TenantApplicationStatus[] = ["received", "shortlisted", "referencing", "approved"];
// Archived statuses (closed)
const ARCHIVED_STATUSES: TenantApplicationStatus[] = ["rejected", "withdrawn"];

// -- Manual add form ----------------------------------------------------------

type AddFormState = {
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

function AddApplicationSheet({ onSuccess }: Readonly<{ onSuccess: () => void }>) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AddFormState>({
    applicant_name: "",
    applicant_email: "",
    monthly_income: "",
    employment_status: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.applicant_name || !form.applicant_email) {
      toast.error("Name and email are required");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Authentication required");
      }

      const { error } = await supabase.from("tenant_applications").insert({
        applicant_name: form.applicant_name,
        applicant_email: form.applicant_email,
        monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
        employment_status: form.employment_status || null,
        landlord_id: user.id,
        status: "received",
        credit_check_status: "not_run",
        references_status: "pending",
      });

      if (error) throw new Error(error.message);

      toast.success("Application added successfully");
      setOpen(false);
      setForm({ applicant_name: "", applicant_email: "", monthly_income: "", employment_status: "" });
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
        <Button className="bg-brand-primary hover:bg-[color:var(--color-brand-primary-light)] text-white font-medium">
          <Plus className="mr-2 size-4" />
          Add Application
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-heading">Add Application</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            className="w-full bg-brand-primary hover:bg-[color:var(--color-brand-primary-light)] text-white"
          >
            {submitting ? "Adding..." : "Add Application"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// -- Application list card (list view) ----------------------------------------

function ApplicationListCard({ application }: Readonly<{ application: TenantApplication }>) {
  const statusStyle = STATUS_STYLES[application.status];
  const initials = application.applicant_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 hover:shadow-sm hover:border-brand-primary/30 transition-all duration-150">
      {/* Avatar */}
      <div className="size-10 shrink-0 rounded-xl bg-[color:var(--color-brand-primary-lighter)] dark:bg-brand-primary/20 text-[color:var(--color-brand-primary)] dark:text-brand-primary flex items-center justify-center font-bold text-sm font-heading">
        {initials}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm font-heading truncate">{application.applicant_name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 truncate">
          <Mail className="size-3 shrink-0" />
          <span className="truncate">{application.applicant_email}</span>
        </div>
      </div>

      {/* Employment + income */}
      <div className="hidden sm:flex flex-col gap-0.5 min-w-[140px]">
        {application.employment_status && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Briefcase className="size-3 shrink-0" />
            <span className="truncate">{application.employment_status}</span>
          </div>
        )}
        {application.monthly_income != null && (
          <div className="flex items-center gap-1 text-xs text-foreground font-medium">
            <PoundSterling className="size-3 shrink-0" />
            {application.monthly_income.toLocaleString("en-GB")}/mo
          </div>
        )}
      </div>

      {/* Status badge */}
      <div className="hidden md:block shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
        >
          <span className={`size-1.5 rounded-full ${statusStyle.dot}`} />
          {statusStyle.label}
        </span>
      </div>

      {/* CTA */}
      <Button
        asChild
        size="sm"
        variant="outline"
        className="shrink-0 h-8 text-xs border-[color:var(--color-brand-primary)]/30 text-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-brand-primary-lighter)] dark:border-brand-primary/30 dark:text-brand-primary"
      >
        <Link href={`/dashboard/landlord/tenants/${application.id}`}>
          Manage
          <ArrowRight className="ml-1.5 size-3" />
        </Link>
      </Button>
    </div>
  );
}

// -- Main client component ----------------------------------------------------

type TenantScreeningClientProps = Readonly<{
  initialApplications: TenantApplication[];
}>;

export function TenantScreeningClient({ initialApplications }: TenantScreeningClientProps) {
  const router = useRouter();
  const [applications] = useState<TenantApplication[]>(initialApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const totalApplications = applications.length;
  const approvedCount = applications.filter((a) => a.status === "approved").length;
  const referencingCount = applications.filter((a) => a.status === "referencing").length;

  function filtered(statuses: TenantApplicationStatus[]) {
    return applications.filter(
      (a) =>
        statuses.includes(a.status) &&
        (searchQuery === "" ||
          a.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.applicant_email.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }

  function byStatus(status: TenantApplicationStatus) {
    return applications.filter(
      (a) =>
        a.status === status &&
        (searchQuery === "" ||
          a.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.applicant_email.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }

  const activeApps = filtered(ACTIVE_STATUSES);
  const archivedApps = filtered(ARCHIVED_STATUSES);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Tenants
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Managing all active tenancies across your London portfolio.
          </p>
        </div>
        <AddApplicationSheet onSuccess={() => router.refresh()} />
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total
          </p>
          <p className="mt-1.5 text-2xl font-bold font-heading text-foreground">
            {totalApplications}
          </p>
        </div>
        <div className="rounded-xl border border-success/30 dark:border-success/20 bg-success-light dark:bg-success/10 p-4">
          <p className="text-xs font-medium text-success uppercase tracking-wide">
            Approved
          </p>
          <p className="mt-1.5 text-2xl font-bold font-heading text-success">
            {approvedCount}
          </p>
        </div>
        <div className="rounded-xl border border-warning/30 dark:border-warning/20 bg-warning-light dark:bg-warning/10 p-4">
          <p className="text-xs font-medium text-warning uppercase tracking-wide">
            Referencing
          </p>
          <p className="mt-1.5 text-2xl font-bold font-heading text-warning">
            {referencingCount}
          </p>
        </div>
      </div>

      {/* Search + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search applicants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-muted-foreground">
            <Filter className="mr-2 size-4" />
            Filter
          </Button>
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-neutral-900 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-neutral-900 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="size-3.5" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Kanban board view */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 overflow-x-auto">
          {COLUMNS.map((col) => {
            const colApps = byStatus(col.status);
            return (
              <div key={col.status} className="flex flex-col min-w-0">
                {/* Column header */}
                <div
                  className={`flex items-center justify-between rounded-t-xl border px-3 py-2.5 ${col.headerClass}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${col.dotClass}`} />
                    <span className="font-semibold text-sm font-heading">{col.label}</span>
                  </div>
                  <span
                    className={`inline-flex items-center justify-center rounded-full min-w-[1.25rem] px-1.5 py-0.5 text-xs font-bold ${col.countClass}`}
                  >
                    {colApps.length}
                  </span>
                </div>

                {/* Column body */}
                <div className="flex-1 min-h-[140px] rounded-b-xl border border-t-0 border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/20 p-2">
                  {colApps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[120px] gap-1">
                      <Users className="size-5 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground/60 text-center">
                        No applications
                      </p>
                    </div>
                  ) : (
                    colApps.map((app) => (
                      <ApplicationPipelineCard key={app.id} application={app} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view with Active / Archived tabs */}
      {viewMode === "list" && (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="h-10 w-fit rounded-xl">
            <TabsTrigger value="active" className="rounded-lg px-4">
              Active
              {activeApps.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-[color:var(--color-brand-primary-lighter)] dark:bg-brand-primary/20 text-[color:var(--color-brand-primary)] dark:text-brand-primary min-w-[1.25rem] px-1.5 py-0.5 text-xs font-bold">
                  {activeApps.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="rounded-lg px-4">
              Archived
              {archivedApps.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 min-w-[1.25rem] px-1.5 py-0.5 text-xs font-bold">
                  {archivedApps.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {activeApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Users className="size-8 opacity-40" />
                <p className="text-sm">No active applications found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeApps.map((app) => (
                  <ApplicationListCard key={app.id} application={app} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="mt-4">
            {archivedApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Users className="size-8 opacity-40" />
                <p className="text-sm">No archived applications.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {archivedApps.map((app) => (
                  <ApplicationListCard key={app.id} application={app} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
