"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, XCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ComplianceDocument } from "@/types/landlord";

type Props = Readonly<{
  documents: ComplianceDocument[];
}>;

const CATEGORY_LABELS: Record<string, string> = {
  gas_safety: "Gas Safety (CP12)",
  electrical_eicr: "Electrical EICR",
  epc: "Energy Performance Certificate",
  deposit_protection: "Deposit Protection",
};

function toDateKey(dateStr: string): string {
  // normalise to YYYY-MM-DD without timezone shift
  return dateStr.slice(0, 10);
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function ComplianceExpiryCalendar({ documents }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Build sets of dates per status
  const expiredDates: Date[] = [];
  const expiringSoonDates: Date[] = [];
  const upcomingDates: Date[] = [];

  // Track all docs by date key for click lookup
  const docsByDate: Record<string, ComplianceDocument[]> = {};

  for (const doc of documents) {
    if (!doc.expiry_date) continue;
    const key = toDateKey(doc.expiry_date);
    if (!docsByDate[key]) docsByDate[key] = [];
    docsByDate[key].push(doc);

    const date = parseLocalDate(doc.expiry_date);
    if (doc.status === "expired") {
      expiredDates.push(date);
    } else if (doc.status === "expiring_soon") {
      expiringSoonDates.push(date);
    } else if (doc.status === "valid") {
      upcomingDates.push(date);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ninetyDaysOut = new Date(today);
  ninetyDaysOut.setDate(ninetyDaysOut.getDate() + 90);

  // Docs for selected date
  const selectedKey = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : null;
  const selectedDocs = selectedKey ? (docsByDate[selectedKey] ?? []) : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <CalendarDays className="size-4" />
          90-Day Expiry Overview
        </CardTitle>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-red-500" />
            Expired
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-amber-400" />
            Expiring within 30 days
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-green-500" />
            Valid (30–90 days)
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Calendar */}
        <div className="overflow-x-auto">
          <DayPicker
            numberOfMonths={3}
            defaultMonth={today}
            modifiers={{
              expired: expiredDates,
              expiring: expiringSoonDates,
              upcoming: upcomingDates,
            }}
            modifiersStyles={{
              expired: {
                backgroundColor: "#ef4444",
                color: "#fff",
                borderRadius: "50%",
                fontWeight: "600",
              },
              expiring: {
                backgroundColor: "#f59e0b",
                color: "#fff",
                borderRadius: "50%",
                fontWeight: "600",
              },
              upcoming: {
                backgroundColor: "#22c55e",
                color: "#fff",
                borderRadius: "50%",
                fontWeight: "600",
              },
            }}
            selected={selectedDate}
            onDayClick={(day) => {
              const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
              if (docsByDate[key]) {
                setSelectedDate(
                  selectedDate && toDateKey(selectedDate.toISOString()) === key
                    ? undefined
                    : day,
                );
              } else {
                setSelectedDate(undefined);
              }
            }}
            styles={{
              months: { display: "flex", flexWrap: "wrap", gap: "1rem" },
            }}
          />
        </div>

        {/* Detail panel */}
        {selectedDate && selectedDocs.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-3 text-sm font-semibold">
              Certificates expiring{" "}
              {selectedDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="space-y-2">
              {selectedDocs.map((doc) => {
                const address = [
                  doc.property.address_line_1,
                  doc.property.city,
                  doc.property.postcode,
                ]
                  .filter(Boolean)
                  .join(", ");

                const isExpired = doc.status === "expired";
                const isExpiring = doc.status === "expiring_soon";

                return (
                  <div
                    key={doc.id}
                    className="flex items-start gap-2.5 rounded-md border bg-background p-3"
                  >
                    {isExpired ? (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                    ) : isExpiring ? (
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {address || "Unknown address"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[doc.category] ?? doc.category}
                        </Badge>
                        <Badge
                          className={`border-0 text-xs ${
                            isExpired
                              ? "bg-red-100 text-red-700"
                              : isExpiring
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isExpired
                            ? "Expired"
                            : isExpiring
                              ? "Expiring soon"
                              : "Valid"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
