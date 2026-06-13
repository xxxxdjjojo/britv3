"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

import type { TenantApplication, TenantApplicationStatus } from "@/types/landlord";
import { ApplicationPipelineCard } from "@/components/landlord/ApplicationPipelineCard";
import { Button } from "@/components/ui/button";
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

// -- Kanban column config -----------------------------------------------------

type KanbanColumn = {
  status: TenantApplicationStatus;
  label: string;
  headerClass: string;
  countClass: string;
};

const COLUMNS: KanbanColumn[] = [
  {
    status: "received",
    label: "Received",
    headerClass: "bg-muted dark:bg-gray-800/40",
    countClass: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  },
  {
    status: "shortlisted",
    label: "Shortlisted",
    headerClass: "bg-blue-50 dark:bg-blue-900/20",
    countClass: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  },
  {
    status: "referencing",
    label: "Referencing",
    headerClass: "bg-amber-50 dark:bg-amber-900/20",
    countClass: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  },
  {
    status: "approved",
    label: "Approved",
    headerClass: "bg-green-50 dark:bg-green-900/20",
    countClass: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  },
  {
    status: "rejected",
    label: "Rejected",
    headerClass: "bg-red-50 dark:bg-red-900/20",
    countClass: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  },
];

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
        <Button style={{ backgroundColor: "#1B4D3E" }} className="text-white hover:opacity-90">
          <Plus className="mr-2 size-4" />
          Add Application
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Application</SheetTitle>
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
            className="w-full"
            style={{ backgroundColor: "#1B4D3E" }}
          >
            {submitting ? "Adding..." : "Add Application"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// -- Main client component ----------------------------------------------------

type TenantScreeningClientProps = Readonly<{
  initialApplications: TenantApplication[];
}>;

export function TenantScreeningClient({ initialApplications }: TenantScreeningClientProps) {
  const router = useRouter();
  const [applications] = useState<TenantApplication[]>(initialApplications);

  function byStatus(status: TenantApplicationStatus) {
    return applications.filter((a) => a.status === status);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenant Screening</h1>
          <p className="text-muted-foreground">
            {applications.length} application{applications.length !== 1 ? "s" : ""} across your portfolio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>{applications.filter((a) => a.status === "approved").length} approved</span>
          </div>
          <AddApplicationSheet onSuccess={() => router.refresh()} />
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 overflow-x-auto">
        {COLUMNS.map((col) => {
          const colApps = byStatus(col.status);
          return (
            <div key={col.status} className="flex flex-col min-w-0">
              {/* Column header */}
              <div
                className={`flex items-center justify-between rounded-t-lg px-3 py-2 ${col.headerClass}`}
              >
                <span className="font-semibold text-sm">{col.label}</span>
                <span
                  className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${col.countClass}`}
                >
                  {colApps.length}
                </span>
              </div>

              {/* Column body */}
              <div className="flex-1 min-h-[120px] rounded-b-lg border border-t-0 border-slate-200 dark:border-slate-700 bg-surface/50 dark:bg-slate-800/20 p-2">
                {colApps.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center pt-6">No applications</p>
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
    </div>
  );
}
