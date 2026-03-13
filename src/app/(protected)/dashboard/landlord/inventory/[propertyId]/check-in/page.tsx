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
        // First save — create the report
        // landlord_id is overwritten server-side by createInventoryReport using auth user
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
        // Update existing draft
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
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard/landlord/portfolio" className="hover:text-foreground">
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
        <span className="text-foreground font-medium">Check-In Report</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            Inventory Check-In Report
          </h1>
          <p className="text-sm text-muted-foreground">
            Document each room&apos;s condition at the start of the tenancy
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === "complete" && (
            <Badge className="bg-success text-white border-0">
              <CheckCircle2 className="mr-1.5 size-3.5" />
              Complete
            </Badge>
          )}
          {status === "draft" && reportId && (
            <Badge variant="secondary">Draft saved</Badge>
          )}
        </div>
      </div>

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
          <Button variant="outline" size="sm" onClick={addRoom}>
            <Plus className="mr-1.5 size-4" />
            Add Room
          </Button>
        </div>
      )}

      {/* Overall notes */}
      <div className="flex flex-col gap-1.5">
        <Label>Overall Notes</Label>
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
