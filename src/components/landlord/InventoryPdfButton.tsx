"use client";

/**
 * InventoryPdfButton — generates and downloads an inventory report PDF.
 * This component is dynamically imported with ssr:false in the inventory pages
 * to avoid @react-pdf/renderer server-rendering issues.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Download } from "lucide-react";
import type { RoomCondition } from "./InventoryRoomForm";

// -- Types -------------------------------------------------------------------

type RoomData = {
  name: string;
  condition: RoomCondition;
  notes: string;
  photoUrls?: string[];
};

type CheckInRoom = {
  name: string;
  condition: RoomCondition;
  notes: string;
};

type Props = Readonly<{
  reportId: string;
  reportType: "check_in" | "check_out";
  propertyAddress: string;
  rooms: RoomData[];
  overallNotes: string;
  checkInRooms?: CheckInRoom[]; // only for check_out — side-by-side comparison
}>;

// -- PDF styles --------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1a1a2e",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
  },
  section: {
    marginBottom: 16,
  },
  roomHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    backgroundColor: "#f3f4f6",
    padding: 6,
    borderRadius: 4,
  },
  roomGrid: {
    flexDirection: "row",
    gap: 12,
  },
  roomColumn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
  },
  columnLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  conditionBadge: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  notes: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  overallNotes: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  label: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9ca3af",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

// -- Condition colour --------------------------------------------------------

function conditionColor(c: RoomCondition): string {
  if (c === "excellent" || c === "good") return "#16a34a";
  if (c === "fair") return "#d97706";
  return "#dc2626";
}

// -- PDF Document components -------------------------------------------------

function CheckInDocument({
  propertyAddress,
  rooms,
  overallNotes,
}: Readonly<{ propertyAddress: string; rooms: RoomData[]; overallNotes: string }>) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Inventory Check-In Report</Text>
          <Text style={styles.subtitle}>{propertyAddress}</Text>
          <Text style={styles.subtitle}>
            Generated: {new Date().toLocaleDateString("en-GB")}
          </Text>
        </View>

        {/* Rooms */}
        {rooms.map((room) => (
          <View key={room.name} style={styles.section}>
            <Text style={styles.roomHeader}>{room.name}</Text>
            <Text
              style={[
                styles.conditionBadge,
                { color: conditionColor(room.condition) },
              ]}
            >
              Condition:{" "}
              {room.condition.charAt(0).toUpperCase() + room.condition.slice(1)}
            </Text>
            {room.notes ? (
              <Text style={styles.notes}>{room.notes}</Text>
            ) : (
              <Text style={[styles.notes, { color: "#9ca3af" }]}>No notes.</Text>
            )}
          </View>
        ))}

        {/* Overall notes */}
        {overallNotes && (
          <View style={styles.section}>
            <Text style={styles.label}>Overall Notes</Text>
            <Text style={styles.overallNotes}>{overallNotes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Britestate — Landlord Inventory Report</Text>
          <Text>{propertyAddress}</Text>
        </View>
      </Page>
    </Document>
  );
}

function CheckOutDocument({
  propertyAddress,
  rooms,
  checkInRooms,
  overallNotes,
}: Readonly<{
  propertyAddress: string;
  rooms: RoomData[];
  checkInRooms: CheckInRoom[];
  overallNotes: string;
}>) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Inventory Check-Out Report</Text>
          <Text style={styles.subtitle}>{propertyAddress}</Text>
          <Text style={styles.subtitle}>
            Generated: {new Date().toLocaleDateString("en-GB")}
          </Text>
        </View>

        {/* Side-by-side rooms */}
        {checkInRooms.map((ciRoom) => {
          const coRoom = rooms.find((r) => r.name === ciRoom.name);
          return (
            <View key={ciRoom.name} style={styles.section}>
              <Text style={styles.roomHeader}>{ciRoom.name}</Text>
              <View style={styles.roomGrid}>
                {/* Check-in column */}
                <View style={styles.roomColumn}>
                  <Text style={styles.columnLabel}>Check-In</Text>
                  <Text
                    style={[
                      styles.conditionBadge,
                      { color: conditionColor(ciRoom.condition) },
                    ]}
                  >
                    {ciRoom.condition.charAt(0).toUpperCase() +
                      ciRoom.condition.slice(1)}
                  </Text>
                  <Text style={styles.notes}>{ciRoom.notes || "No notes."}</Text>
                </View>

                {/* Check-out column */}
                <View style={styles.roomColumn}>
                  <Text style={styles.columnLabel}>Check-Out</Text>
                  {coRoom ? (
                    <>
                      <Text
                        style={[
                          styles.conditionBadge,
                          { color: conditionColor(coRoom.condition) },
                        ]}
                      >
                        {coRoom.condition.charAt(0).toUpperCase() +
                          coRoom.condition.slice(1)}
                      </Text>
                      <Text style={styles.notes}>
                        {coRoom.notes || "No notes."}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.notes, { color: "#9ca3af" }]}>
                      Not assessed.
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {/* Overall notes */}
        {overallNotes && (
          <View style={styles.section}>
            <Text style={styles.label}>Overall Notes</Text>
            <Text style={styles.overallNotes}>{overallNotes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Britestate — Landlord Inventory Report</Text>
          <Text>{propertyAddress}</Text>
        </View>
      </Page>
    </Document>
  );
}

// -- Download button ---------------------------------------------------------

export default function InventoryPdfButton({
  reportType,
  propertyAddress,
  rooms,
  overallNotes,
  checkInRooms = [],
}: Props) {
  // Filename is derived purely from stable props — no side effects
  const prefix = reportType === "check_in" ? "check-in" : "check-out";
  const fileName = `${prefix}-${reportId}.pdf`;

  const document =
    reportType === "check_in" ? (
      <CheckInDocument
        propertyAddress={propertyAddress}
        rooms={rooms}
        overallNotes={overallNotes}
      />
    ) : (
      <CheckOutDocument
        propertyAddress={propertyAddress}
        rooms={rooms}
        checkInRooms={checkInRooms}
        overallNotes={overallNotes}
      />
    );

  return (
    <PDFDownloadLink document={document} fileName={fileName}>
      {({ loading }) => (
        <button
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          <Download className="size-4" />
          {loading ? "Preparing PDF..." : "Download Report PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
