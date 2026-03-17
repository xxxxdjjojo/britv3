"use client";

/**
 * Inventory Check-Out Report (9.24)
 * Side-by-side comparison of check-in vs check-out condition per room.
 * Loads the most recent complete check-in report for comparison.
 * Supports "Log Deduction" per room for deposit claim purposes.
 */

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getInventoryReports,
  createInventoryReport,
  updateInventoryReport,
} from "@/services/landlord/inventory-service";
import {
  InventoryRoomForm,
  isConditionWorse,
  type RoomEntry,
  type RoomCondition,
} from "@/components/landlord/InventoryRoomForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  PoundSterling,
  X,
} from "lucide-react";
import type { InventoryReport } from "@/types/landlord";

// -- PDF renderer — SSR:false ------------------------------------------------

const PdfDownloadButton = dynamic(
  () => import("@/components/landlord/InventoryPdfButton"),
  { ssr: false, loading: () => null },
);

// -- Types -------------------------------------------------------------------

type CheckInRoom = {
  name: string;
  condition: RoomCondition;
  notes: string;
};

type CheckOutRoom = {
  name: string;
  condition: RoomCondition;
  notes: string;
  photoUrls: string[];
};

type Deduction = {
  roomName: string;
  amount: string;
  reason: string;
};

// -- Helper ------------------------------------------------------------------

function conditionLabel(c: RoomCondition) {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

const CONDITION_BADGE_STYLES: Record<RoomCondition, string> = {
  excellent: "bg-success/10 text-success border-success/20",
  good: "bg-success/10 text-success border-success/20",
  fair: "bg-warning/10 text-warning border-warning/20",
  poor: "bg-error/10 text-error border-error/20",
  damaged: "bg-error/10 text-error border-error/20",
};

// -- Page component ----------------------------------------------------------

export default function CheckOutPage() {
  const params = useParams();
  const propertyId = params?.propertyId as string;

  const [propertyAddress, setPropertyAddress] = useState("");
  const [checkInReport, setCheckInReport] = useState<InventoryReport | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "complete">("draft");
  const [checkOutRooms, setCheckOutRooms] = useState<CheckOutRoom[]>([]);
  const [overallNotes, setOverallNotes] = useState("");
  const [deductions, setDeductions] = useState<Record<string, Deduction>>({});
  const [openDeductionRoom, setOpenDeductionRoom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load property + check-in report
  useEffect(() => {
    if (!propertyId) return;

    const load = async () => {
      setLoading(true);
      const supabase = createClient();

      // Fetch property address
      const { data: listing } = await supabase
        .from("listings")
        .select("address_line_1, city, postcode")
        .eq("id", propertyId)
        .maybeSingle();

      if (listing) {
        setPropertyAddress(
          `${listing.address_line_1 as string}, ${listing.city as string} ${listing.postcode as string}`,
        );
      }

      // Fetch inventory reports for this property
      try {
        const reports = await getInventoryReports(supabase, propertyId);

        // Most recent complete check-in
        const checkIn = reports.find(
          (r) => r.type === "check_in" && r.status === "complete",
        ) ?? null;
        setCheckInReport(checkIn);

        // Existing check-out draft (if any)
        const checkOut = reports.find(
          (r) => r.type === "check_out" && r.status === "draft",
        ) ?? null;

        if (checkIn) {
          // Initialise check-out rooms from check-in room names
          const checkInRooms = (checkIn.rooms ?? []) as CheckInRoom[];

          if (checkOut) {
            setReportId(checkOut.id);
            setStatus(checkOut.status as "draft" | "complete");
            setOverallNotes(checkOut.notes ?? "");
            const existingRooms = (checkOut.rooms ?? []) as CheckOutRoom[];
            setCheckOutRooms(
              checkInRooms.map((ciRoom) => {
                const existing = existingRooms.find(
                  (r) => r.name === ciRoom.name,
                );
                return {
                  name: ciRoom.name,
                  condition: (existing?.condition ?? ciRoom.condition) as RoomCondition,
                  notes: existing?.notes ?? "",
                  photoUrls: existing?.photoUrls ?? [],
                };
              }),
            );
          } else {
            // No draft — seed from check-in rooms
            setCheckOutRooms(
              checkInRooms.map((r) => ({
                name: r.name,
                condition: r.condition as RoomCondition,
                notes: "",
                photoUrls: [],
              })),
            );
          }
        }
      } catch (err) {
        console.warn("Could not load inventory reports:", err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [propertyId]);

  // Update a check-out room
  const updateCheckOutRoom = useCallback(
    (roomName: string, entry: RoomEntry) => {
      setCheckOutRooms((prev) =>
        prev.map((r) =>
          r.name === roomName
            ? {
                ...r,
                condition: entry.condition,
                notes: entry.notes,
                photoUrls: entry.photoUrls,
              }
            : r,
        ),
      );
    },
    [],
  );

  const buildRoomsPayload = () =>
    checkOutRooms.map((r) => ({
      name: r.name,
      condition: r.condition,
      notes: r.notes,
    }));

  const allPhotoUrls = checkOutRooms.flatMap((r) => r.photoUrls);

  // Save draft
  const saveDraft = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();
      const roomsPayload = buildRoomsPayload();

      if (!reportId) {
        // landlord_id is overwritten server-side by createInventoryReport using auth user
        const report = await createInventoryReport(supabase, {
          property_id: propertyId,
          landlord_id: "",
          tenancy_id: null,
          type: "check_out",
          status: "draft",
          rooms: roomsPayload,
          notes: overallNotes || null,
          photo_urls: allPhotoUrls,
          completed_at: null,
        });
        setReportId(report.id);
      } else {
        await updateInventoryReport(supabase, reportId, {
          rooms: roomsPayload,
          notes: overallNotes || null,
          photo_urls: allPhotoUrls,
        });
      }
      setSuccessMsg("Draft saved.");
    } catch (err) {
      setError((err as Error).message ?? "Failed to save draft.");
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, propertyId, checkOutRooms, overallNotes, allPhotoUrls]);

  // Mark complete
  const markComplete = useCallback(async () => {
    setCompleting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();
      const roomsPayload = buildRoomsPayload();

      if (!reportId) {
        const report = await createInventoryReport(supabase, {
          property_id: propertyId,
          landlord_id: "",
          tenancy_id: null,
          type: "check_out",
          status: "complete",
          rooms: roomsPayload,
          notes: overallNotes || null,
          photo_urls: allPhotoUrls,
          completed_at: new Date().toISOString(),
        });
        setReportId(report.id);
      } else {
        await updateInventoryReport(supabase, reportId, {
          rooms: roomsPayload,
          notes: overallNotes || null,
          photo_urls: allPhotoUrls,
          status: "complete",
          completed_at: new Date().toISOString(),
        });
      }
      setStatus("complete");
      setSuccessMsg("Check-out report marked as complete.");
    } catch (err) {
      setError((err as Error).message ?? "Failed to complete report.");
    } finally {
      setCompleting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, propertyId, checkOutRooms, overallNotes, allPhotoUrls]);

  // Deduction handlers
  const toggleDeduction = (roomName: string) => {
    setOpenDeductionRoom((prev) => (prev === roomName ? null : roomName));
  };

  const saveDeduction = (roomName: string, amount: string, reason: string) => {
    setDeductions((prev) => ({ ...prev, [roomName]: { roomName, amount, reason } }));
    setOpenDeductionRoom(null);
  };

  const removeDeduction = (roomName: string) => {
    setDeductions((prev) => {
      const next = { ...prev };
      delete next[roomName];
      return next;
    });
  };

  // -- Render -----------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get check-in rooms as typed array
  const checkInRooms = ((checkInReport?.rooms ?? []) as CheckInRoom[]);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard/landlord/properties" className="hover:text-foreground">
          Properties
        </Link>
        <ChevronRight className="size-4" />
        {propertyAddress ? (
          <Link
            href={`/dashboard/landlord/properties/${propertyId}`}
            className="hover:text-foreground"
          >
            {propertyAddress}
          </Link>
        ) : (
          <span>Property</span>
        )}
        <ChevronRight className="size-4" />
        <span className="text-foreground font-medium">Check-Out Report</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            Inventory Check-Out Report
          </h1>
          <p className="text-sm text-muted-foreground">
            Compare current condition against check-in to identify any changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === "complete" && (
            <Badge className="bg-success text-white border-0">
              <CheckCircle2 className="mr-1.5 size-3.5" />
              Complete
            </Badge>
          )}
        </div>
      </div>

      {/* No check-in report warning */}
      {!checkInReport && (
        <Card className="border-warning/30 bg-warning-light">
          <CardContent className="flex items-start gap-3 pt-4">
            <AlertTriangle className="size-5 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-warning">No completed check-in report found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete a check-in report first so you can compare conditions at check-out.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-warning/50"
                render={
                  <Link
                    href={`/dashboard/landlord/inventory/${propertyId}/check-in`}
                  />
                }
              >
                Go to Check-In
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Side-by-side room comparison */}
      {checkInReport && checkInRooms.length > 0 && (
        <div className="flex flex-col gap-6">
          {/* Column headers (large screens) */}
          <div className="hidden items-center gap-4 lg:grid lg:grid-cols-[1fr_1fr]">
            <div className="rounded-lg bg-muted px-4 py-2 text-sm font-semibold">
              Check-In (Original)
            </div>
            <div className="rounded-lg bg-brand-primary-lighter px-4 py-2 text-sm font-semibold text-brand-primary">
              Check-Out (Current)
            </div>
          </div>

          {checkInRooms.map((ciRoom) => {
            const coRoom = checkOutRooms.find((r) => r.name === ciRoom.name);
            const conditionWorse =
              coRoom &&
              isConditionWorse(
                coRoom.condition as RoomCondition,
                ciRoom.condition as RoomCondition,
              );
            const deduction = deductions[ciRoom.name];

            return (
              <div key={ciRoom.name} className="flex flex-col gap-4">
                {/* Room label + deterioration indicator */}
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{ciRoom.name}</h3>
                  {conditionWorse && (
                    <Badge className="border-0 bg-error/10 text-error text-xs">
                      <AlertTriangle className="mr-1 size-3" />
                      Deteriorated
                    </Badge>
                  )}
                </div>

                {/* Two-column layout on large screens */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Check-in (read-only) */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Check-In
                    </p>
                    <Badge
                      variant="outline"
                      className={CONDITION_BADGE_STYLES[ciRoom.condition as RoomCondition]}
                    >
                      {conditionLabel(ciRoom.condition as RoomCondition)}
                    </Badge>
                    {ciRoom.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {ciRoom.notes}
                      </p>
                    )}
                  </div>

                  {/* Check-out (editable) */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Check-Out
                    </p>
                    {coRoom && (
                      <InventoryRoomForm
                        roomName={ciRoom.name}
                        reportId={reportId}
                        initialCondition={coRoom.condition}
                        initialNotes={coRoom.notes}
                        initialPhotoUrls={coRoom.photoUrls}
                        onUpdate={(entry) =>
                          updateCheckOutRoom(ciRoom.name, entry)
                        }
                      />
                    )}
                  </div>
                </div>

                {/* Deduction section */}
                {conditionWorse && status !== "complete" && (
                  <div className="flex flex-col gap-2 pl-2">
                    {deduction ? (
                      <div className="flex items-start justify-between rounded-lg border border-error/20 bg-error/5 px-3 py-2">
                        <div>
                          <p className="text-xs font-medium text-error">
                            Deduction: £{deduction.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {deduction.reason}
                          </p>
                        </div>
                        <button
                          onClick={() => removeDeduction(ciRoom.name)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-fit border-error/30 text-error hover:bg-error/10"
                        onClick={() => toggleDeduction(ciRoom.name)}
                      >
                        <PoundSterling className="mr-1.5 size-3.5" />
                        Log Deduction
                      </Button>
                    )}

                    {/* Inline deduction form */}
                    {openDeductionRoom === ciRoom.name && (
                      <DeductionForm
                        roomName={ciRoom.name}
                        onSave={saveDeduction}
                        onCancel={() => setOpenDeductionRoom(null)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Overall notes */}
      {checkInReport && (
        <div className="flex flex-col gap-1.5">
          <Label>Overall Notes</Label>
          <Textarea
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            placeholder="Any additional notes about the property overall at check-out..."
            rows={4}
            className="resize-none"
            disabled={status === "complete"}
          />
        </div>
      )}

      {/* Action buttons */}
      {checkInReport && (
        <div className="flex flex-wrap items-center gap-3">
          {status !== "complete" && (
            <>
              <Button
                variant="outline"
                onClick={() => void saveDraft()}
                disabled={saving || completing}
              >
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Save Draft
              </Button>
              <Button
                onClick={() => void markComplete()}
                disabled={saving || completing}
              >
                {completing ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 size-4" />
                )}
                Mark Complete
              </Button>
            </>
          )}

          {/* PDF export (side-by-side) — dynamically imported, SSR false */}
          {reportId && (
            <PdfDownloadButton
              reportId={reportId}
              reportType="check_out"
              propertyAddress={propertyAddress}
              rooms={checkOutRooms}
              overallNotes={overallNotes}
              checkInRooms={checkInRooms}
            />
          )}
        </div>
      )}
    </div>
  );
}

// -- DeductionForm (inline) --------------------------------------------------

type DeductionFormProps = Readonly<{
  roomName: string;
  onSave: (roomName: string, amount: string, reason: string) => void;
  onCancel: () => void;
}>;

function DeductionForm({ roomName, onSave, onCancel }: DeductionFormProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  return (
    <Card className="border-error/20">
      <CardContent className="flex flex-col gap-3 pt-4">
        <p className="text-sm font-medium">Log Deduction — {roomName}</p>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Amount (£)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="max-w-[120px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Reason</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the damage or reason for deduction..."
            rows={2}
            className="resize-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onSave(roomName, amount, reason)}
            disabled={!amount || !reason}
          >
            Save Deduction
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
