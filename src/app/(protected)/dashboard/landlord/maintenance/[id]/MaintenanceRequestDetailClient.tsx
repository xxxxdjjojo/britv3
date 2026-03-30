"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import {
  MapPin,
  Phone,
  Mail,
  User,
  HardHat,
  Check,
  Clock,
  AlertTriangle,
  ChevronRight,
  Save,
  MessageCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { MaintenanceRequestWithProperty } from "@/services/landlord/maintenance-service";
import type { MaintenanceStatus } from "@/types/landlord";
import { MaintenancePriorityBadge } from "@/components/landlord/MaintenancePriorityBadge";
import { MaintenanceStatusBadge } from "@/components/landlord/MaintenanceStatusBadge";

// -- Status timeline ----------------------------------------------------------

const STATUS_STEPS: {
  key: MaintenanceStatus;
  label: string;
  icon: typeof Check;
}[] = [
  { key: "new", label: "New", icon: AlertTriangle },
  { key: "acknowledged", label: "Acknowledged", icon: Clock },
  { key: "assigned", label: "Assigned", icon: HardHat },
  { key: "in_progress", label: "In Progress", icon: Clock },
  { key: "resolved", label: "Resolved", icon: Check },
];

const STATUS_ORDER: Record<MaintenanceStatus, number> = {
  new: 0,
  acknowledged: 1,
  assigned: 2,
  in_progress: 3,
  resolved: 4,
  closed: 5,
};

// -- Status update dropdown values -------------------------------------------

const VALID_NEXT_STATUS: Partial<Record<MaintenanceStatus, MaintenanceStatus[]>> = {
  new: ["acknowledged"],
  acknowledged: ["assigned", "in_progress"],
  assigned: ["in_progress"],
  in_progress: ["resolved"],
};

// -- Component ----------------------------------------------------------------

type Props = Readonly<{
  request: MaintenanceRequestWithProperty;
  signedPhotoUrls: string[];
  assignedProvider: {
    id: string;
    business_name: string;
    category: string | null;
    average_rating: number | null;
    city: string | null;
  } | null;
}>;

export function MaintenanceRequestDetailClient({
  request,
  signedPhotoUrls,
  assignedProvider,
}: Props) {
  const [currentStatus, setCurrentStatus] = useState<MaintenanceStatus>(
    request.status,
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showWhatsAppNotify, setShowWhatsAppNotify] = useState(false);
  const [notes, setNotes] = useState(
    (request as unknown as Record<string, unknown>).notes as string | undefined ?? "",
  );
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const currentStepIndex = STATUS_ORDER[currentStatus];
  const nextStatuses = VALID_NEXT_STATUS[currentStatus] ?? [];

  async function handleStatusChange(newStatus: MaintenanceStatus) {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(
        `/api/landlord/maintenance/${request.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update status");
      }
      setCurrentStatus(newStatus);
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      if (newStatus === "assigned" || newStatus === "in_progress") {
        setShowWhatsAppNotify(true);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleNotesSave() {
    setIsSavingNotes(true);
    try {
      const res = await fetch(
        `/api/landlord/maintenance/${request.id}/notes`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save notes");
      }
      toast.success("Notes saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save notes",
      );
    } finally {
      setIsSavingNotes(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* ── Left column (2/3 width) ── */}
      <div className="space-y-6 lg:col-span-2">
        {/* Header card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-xl font-bold text-foreground">
                  {request.title}
                </h1>
                <MaintenancePriorityBadge priority={request.priority} />
                <MaintenanceStatusBadge status={currentStatus} />
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" />
                {request.property_address}
                {request.property_postcode
                  ? `, ${request.property_postcode}`
                  : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Reported{" "}
                {formatDistanceToNow(new Date(request.created_at), {
                  addSuffix: true,
                })}{" "}
                &middot; {format(new Date(request.created_at), "d MMM yyyy")}
              </p>
            </div>

            {/* Status update */}
            {nextStatuses.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Move to:</span>
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(s)}
                    className="rounded-lg border border-brand-primary px-3 py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50"
                  >
                    {s.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-foreground/80">
            {request.description}
          </p>
        </div>

        {/* Status timeline */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-6 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Status Timeline
          </h2>
          <div className="flex items-center">
            {STATUS_STEPS.map((step, index) => {
              const stepIndex = STATUS_ORDER[step.key];
              const isCompleted = stepIndex < currentStepIndex;
              const isActive = step.key === currentStatus;
              const isFuture = stepIndex > currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex size-9 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                        isCompleted
                          ? "bg-brand-primary text-white"
                          : isActive
                            ? "bg-brand-primary text-white ring-4 ring-brand-primary/20"
                            : "border-2 border-border text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="size-4" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-[10px] font-medium ${
                        isFuture
                          ? "text-muted-foreground/50"
                          : "text-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={`mx-1 h-0.5 flex-1 rounded-full ${
                        stepIndex < currentStepIndex
                          ? "bg-brand-primary"
                          : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Photo evidence */}
        {signedPhotoUrls.length > 0 && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Photo Evidence
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {signedPhotoUrls.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-lg border bg-muted"
                >
                  <img
                    src={url}
                    alt={`Maintenance photo ${i + 1}`}
                    className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Private notes */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Private Notes
            </h2>
            <span className="text-xs text-muted-foreground">
              Visible only to you
            </span>
          </div>
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes about this request…"
            rows={4}
            className="w-full rounded-lg border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={isSavingNotes}
              onClick={handleNotesSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary-light transition-colors disabled:opacity-50"
            >
              <Save className="size-4" />
              {isSavingNotes ? "Saving…" : "Save Notes"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right column (1/3 width) ── */}
      <div className="space-y-6">
        {/* Tenant info */}
        {request.tenant_name && (
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Reported By
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-brand-primary/10">
                <User className="size-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {request.tenant_name}
                </p>
                <p className="text-xs text-muted-foreground">Active tenant</p>
              </div>
            </div>
          </div>
        )}

        {/* Assign tradesperson */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <HardHat className="size-4" />
            Tradesperson
          </h2>

          {assignedProvider ? (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm font-semibold text-foreground">
                  {assignedProvider.business_name}
                </p>
                {assignedProvider.city && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {assignedProvider.city}
                  </p>
                )}
                {assignedProvider.average_rating && (
                  <p className="mt-1 text-xs font-medium text-warning">
                    ★ {assignedProvider.average_rating.toFixed(1)}
                  </p>
                )}
              </div>
              <Link
                href={`/dashboard/landlord/maintenance/${request.id}/assign`}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
              >
                Reassign
                <ChevronRight className="size-3" />
              </Link>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-xs text-muted-foreground">
                No tradesperson assigned yet.
              </p>
              <Link
                href={`/dashboard/landlord/maintenance/${request.id}/assign`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
              >
                <HardHat className="size-4" />
                Assign Tradesperson
              </Link>
            </div>
          )}
        </div>

        {/* WhatsApp tenant notification */}
        {showWhatsAppNotify &&
          (currentStatus === "assigned" ||
            currentStatus === "in_progress") && (
            <div className="rounded-xl border border-success/30 bg-success-light p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-success">
                    <MessageCircle className="size-4 text-white" />
                  </div>
                  <h2 className="text-sm font-semibold text-success">
                    Notify Tenant
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWhatsAppNotify(false)}
                  aria-label="Dismiss"
                  className="text-success/60 hover:text-success transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-success/80">
                Let your tenant know their request has been{" "}
                {currentStatus === "assigned"
                  ? "assigned to a tradesperson"
                  : "marked as in progress"}.
              </p>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hi ${request.tenant_name ?? "there"}, your maintenance request "${request.title}" has been ${currentStatus === "assigned" ? "assigned to a tradesperson" : "marked as in progress"} and we'll keep you updated on the resolution. — Your Landlord`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="size-4" />
                Send WhatsApp Update
              </a>
            </div>
          )}

        {/* Quick actions */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <a
              href="tel:"
              className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Phone className="size-4 text-muted-foreground" />
              Call tenant
            </a>
            <a
              href="mailto:"
              className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Mail className="size-4 text-muted-foreground" />
              Email tenant
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
