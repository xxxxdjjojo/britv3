"use client";

/**
 * Inventory Check-In Report (9.23)
 * Room-by-room condition report for a property at the start of a tenancy.
 * Creates an inventory_reports record (type='check_in').
 * Photos upload to the private landlord-documents bucket via InventoryRoomForm.
 */

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  createInventoryReport,
  updateInventoryReport,
} from "@/services/landlord/inventory-service";
import {
  InventoryRoomForm,
  type RoomEntry,
  type RoomCondition,
} from "@/components/landlord/InventoryRoomForm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Plus,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ClipboardList,
} from "lucide-react";

// -- PDF renderer — SSR:false to avoid server rendering issues ---------------

const PdfDownloadButton = dynamic(
  () => import("@/components/landlord/InventoryPdfButton"),
  { ssr: false, loading: () => null },
);

// -- Constants ---------------------------------------------------------------

const DEFAULT_ROOMS = [
  "Entrance Hall",
  "Living Room",
  "Kitchen",
  "Bathroom",
  "Bedroom 1",
  "Bedroom 2",
  "Garden / Outdoor",
  "Other",
];

// -- Types -------------------------------------------------------------------

type RoomState = {
  name: string;
  condition: RoomCondition;
  notes: string;
  photoUrls: string[];
};

// -- Page component ----------------------------------------------------------

export default function CheckInPage() {
  const params = useParams();
  const propertyId = params?.propertyId as string;

  const [propertyAddress, setPropertyAddress] = useState<string>("");
  const [reportId, setReportId] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "complete">("draft");
  const [rooms, setRooms] = useState<RoomState[]>(
    DEFAULT_ROOMS.map((name) => ({
      name,
      condition: "good",
      notes: "",
      photoUrls: [],
    })),
  );
  const [overallNotes, setOverallNotes] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch property address for breadcrumb
  useEffect(() => {
    if (!propertyId) return;

    const fetchProperty = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("listings")
        .select("address_line_1, city, postcode")
        .eq("id", propertyId)
        .maybeSingle();

      if (data) {
        setPropertyAddress(
          `${data.address_line_1 as string}, ${data.city as string} ${data.postcode as string}`,
        );
      }
    };

    void fetchProperty();
  }, [propertyId]);

  // Update a single room's data
  const updateRoom = useCallback((roomName: string, entry: RoomEntry) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.name === roomName
          ? { ...r, condition: entry.condition, notes: entry.notes, photoUrls: entry.photoUrls }
          : r,
      ),
    );
  }, []);

  // Add a custom room
  const addRoom = () => {
    const trimmed = newRoomName.trim();
    if (!trimmed) return;
    if (rooms.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("A room with that name already exists.");
      return;
    }
    setRooms((prev) => [
      ...prev,
      { name: trimmed, condition: "good", notes: "", photoUrls: [] },
    ]);
    setNewRoomName("");
    setError(null);
  };

  // Build rooms payload for inventory_reports table
  const buildRoomsPayload = () =>
    rooms.map((r) => ({
      name: r.name,
      condition: r.condition,
      notes: r.notes,
    }));

  // Build all photo URLs (flat array across rooms)
  const allPhotoUrls = rooms.flatMap((r) => r.photoUrls);

  // Save draft
  const saveDraft = useCallback(async () => {
    setSaving(true);
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
          type: "check_in",
          status: "draft",
          rooms: roomsPayload,
          notes: overallNotes || null,
          photo_urls: allPhotoUrls,
          completed_at: null,
        });
        setReportId(report.id);
        setSuccessMsg("Draft saved.");
      } else {
        await updateInventoryReport(supabase, reportId, {
          rooms: roomsPayload,
          notes: overallNotes || null,
          photo_urls: allPhotoUrls,
        });
        setSuccessMsg("Draft updated.");
      }
    } catch (err) {
      setError((err as Error).message ?? "Failed to save draft.");
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, propertyId, rooms, overallNotes, allPhotoUrls]);

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
          type: "check_in",
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
      setSuccessMsg("Report marked as complete.");
    } catch (err) {
      setError((err as Error).message ?? "Failed to complete report.");
    } finally {
      setCompleting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, propertyId, rooms, overallNotes, allPhotoUrls]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/dashboard/landlord/properties"
          className="hover:text-foreground transition-colors"
        >
          Properties
        </Link>
        <ChevronRight className="size-3.5" />
        {propertyAddress ? (
          <Link
            href={`/dashboard/landlord/properties/${propertyId}`}
            className="hover:text-foreground transition-colors"
          >
            {propertyAddress}
          </Link>
        ) : (
          <span>Property</span>
        )}
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">Check-In Report</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <ClipboardList className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Inventory Check-In Report
            </h1>
            <p className="text-sm text-muted-foreground">
              Document each room&apos;s condition at the start of the tenancy
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status === "complete" && (
            <Badge className="bg-emerald-600 text-white border-0 gap-1.5">
              <CheckCircle2 className="size-3.5" />
              Complete
            </Badge>
          )}
          {status === "draft" && reportId && (
            <Badge variant="secondary" className="gap-1.5">
              <Save className="size-3" />
              Draft saved
            </Badge>
          )}
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Progress summary */}
      <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Rooms documented</span>
          <span className="font-semibold text-foreground">
            {rooms.filter((r) => r.notes.trim() || r.photoUrls.length > 0).length} / {rooms.length}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: `${(rooms.filter((r) => r.notes.trim() || r.photoUrls.length > 0).length / rooms.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Room forms */}
      <div className="flex flex-col gap-4">
        {rooms.map((room) => (
          <InventoryRoomForm
            key={room.name}
            roomName={room.name}
            reportId={reportId}
            initialCondition={room.condition}
            initialNotes={room.notes}
            initialPhotoUrls={room.photoUrls}
            onUpdate={(entry) => updateRoom(room.name, entry)}
          />
        ))}
      </div>

      {/* Add custom room */}
      {status !== "complete" && (
        <div className="flex items-center gap-2">
          <Input
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="New room name (e.g. Utility Room)"
            className="max-w-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRoom();
              }
            }}
          />
          <Button variant="outline" size="sm" onClick={addRoom} className="gap-1.5">
            <Plus className="size-4" />
            Add Room
          </Button>
        </div>
      )}

      {/* Overall notes */}
      <div className="rounded-xl border border-border bg-card p-5">
        <Label className="text-sm font-semibold text-foreground mb-2 block">
          Overall Notes
        </Label>
        <Textarea
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          placeholder="Any additional notes about the property overall..."
          rows={4}
          className="resize-none"
          disabled={status === "complete"}
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        {status !== "complete" && (
          <>
            <Button
              variant="outline"
              onClick={() => void saveDraft()}
              disabled={saving || completing}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={() => void markComplete()}
              disabled={saving || completing}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {completing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Mark Complete
            </Button>
          </>
        )}

        {/* PDF download — dynamically imported, SSR false */}
        {reportId && (
          <PdfDownloadButton
            reportId={reportId}
            reportType="check_in"
            propertyAddress={propertyAddress}
            rooms={rooms}
            overallNotes={overallNotes}
          />
        )}
      </div>
    </div>
  );
}
