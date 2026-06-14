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
        {/* Header */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {request.title}
                </h1>
                <MaintenancePriorityBadge priority={request.priority} />
                <MaintenanceStatusBadge status={currentStatus} />
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <MapPin className="size-4 shrink-0" />
                {request.property_address}
                {request.property_postcode
                  ? `, ${request.property_postcode}`
                  : ""}
              </p>
              <p className="mt-1 text-xs text-slate-400">
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
                <span className="text-xs text-slate-500">Move to:</span>
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

          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
            {request.description}
          </p>
        </div>

        {/* Status timeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-6 text-sm font-semibold text-slate-900 dark:text-white">
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
                            : "border-2 border-slate-200 text-slate-400 dark:border-slate-700"
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
                        isFuture ? "text-slate-400" : "text-slate-700 dark:text-slate-300"
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
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Photo gallery */}
        {signedPhotoUrls.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              Photos
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {signedPhotoUrls.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <img
                    src={url}
                    alt={`Maintenance photo ${i + 1}`}
                    className="aspect-video w-full object-cover hover:scale-105 transition-transform"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            Landlord Notes
          </h2>
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes about this request…"
            rows={4}
            className="w-full rounded-lg border border-slate-200 bg-surface px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={isSavingNotes}
              onClick={handleNotesSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
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
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              Tenant
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-brand-primary/10">
                <User className="size-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {request.tenant_name}
                </p>
                <p className="text-xs text-slate-500">Active tenant</p>
              </div>
            </div>
          </div>
        )}

        {/* Assign tradesperson */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <HardHat className="size-4 text-slate-400" />
            Tradesperson
          </h2>

          {assignedProvider ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {assignedProvider.business_name}
                </p>
                {assignedProvider.city && (
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="size-3" />
                    {assignedProvider.city}
                  </p>
                )}
                {assignedProvider.average_rating && (
                  <p className="text-xs text-amber-600">
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
              <p className="mb-3 text-xs text-slate-500">
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
        {showWhatsAppNotify && (currentStatus === "assigned" || currentStatus === "in_progress") && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-950">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-green-500">
                  <MessageCircle className="size-4 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-green-900 dark:text-green-100">
                  Notify Tenant
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppNotify(false)}
                aria-label="Dismiss"
                className="text-green-500 hover:text-green-700 dark:hover:text-green-300 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-green-800 dark:text-green-200">
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
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="size-4" />
              Send WhatsApp Update
            </a>
          </div>
        )}

        {/* Contact info */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <a
              href={`tel:`}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-surface dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Phone className="size-4 text-slate-400" />
              Call tenant
            </a>
            <a
              href={`mailto:`}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-surface dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Mail className="size-4 text-slate-400" />
              Email tenant
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
