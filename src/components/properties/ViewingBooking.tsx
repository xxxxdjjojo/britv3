"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, Clock, CheckCircle } from "lucide-react";

type ViewingType = "in-person" | "virtual";

type ViewingBookingProps = Readonly<{
  agentName: string;
  propertyAddress: string;
  className?: string;
}>;

const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

function getNext7Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDayLabel(d: Date): { short: string; num: string } {
  return {
    short: d.toLocaleDateString("en-GB", { weekday: "short" }),
    num: d.toLocaleDateString("en-GB", { day: "numeric" }),
  };
}

function formatConfirmDate(d: Date, time: string): string {
  return `${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} at ${time}`;
}

export function ViewingBooking({
  agentName,
  propertyAddress,
  className,
}: ViewingBookingProps) {
  const days = getNext7Days();

  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [viewingType, setViewingType] = useState<ViewingType>("in-person");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const canBook = selectedTime && name.trim() && email.trim();

  function handleBook() {
    if (!canBook) return;
    setConfirmed(true);
  }

  if (confirmed && selectedTime) {
    const confirmDateStr = formatConfirmDate(days[selectedDay], selectedTime);
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Property viewing: ${propertyAddress}`)}&details=${encodeURIComponent(`Viewing with ${agentName}`)}&dates=&location=${encodeURIComponent(propertyAddress)}`;

    return (
      <div
        className={cn(
          "rounded-xl border bg-card p-6 text-center space-y-4",
          className,
        )}
      >
        <div className="flex justify-center">
          <CheckCircle className="size-14 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Viewing Booked!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your {viewingType === "virtual" ? "virtual" : "in-person"} viewing
            has been confirmed.
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm space-y-1">
          <div className="flex items-center gap-2 justify-center">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="font-medium">{confirmDateStr}</span>
          </div>
          <p className="text-muted-foreground">{propertyAddress}</p>
          <p className="text-muted-foreground">With {agentName}</p>
        </div>
        <a
          href={calUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
        >
          <Calendar className="size-4" />
          Add to Google Calendar
        </a>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            setConfirmed(false);
            setSelectedTime(null);
            setName("");
            setEmail("");
            setPhone("");
          }}
        >
          Book another viewing
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-5 space-y-5", className)}>
      <h3 className="font-semibold text-base">Book a Viewing</h3>

      {/* In-person / Virtual toggle */}
      <div className="flex gap-2">
        {(["in-person", "virtual"] as ViewingType[]).map((type) => (
          <button
            key={type}
            onClick={() => setViewingType(type)}
            className={cn(
              "flex-1 rounded-full border py-1.5 text-sm font-medium capitalize transition-colors",
              viewingType === type
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-muted",
            )}
          >
            {type === "in-person" ? "In Person" : "Virtual"}
          </button>
        ))}
      </div>

      {/* Day pills */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Calendar className="size-3.5" /> Select a day
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d, i) => {
            const { short, num } = formatDayLabel(d);
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={cn(
                  "flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-xs transition-colors",
                  i === selectedDay
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-muted",
                )}
              >
                <span className="font-medium">{short}</span>
                <span className="text-base font-bold leading-tight">{num}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Clock className="size-3.5" /> Select a time
        </p>
        <div className="grid grid-cols-3 gap-2">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedTime(slot)}
              className={cn(
                "rounded-lg border py-2 text-xs font-medium transition-colors",
                selectedTime === slot
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted",
              )}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Contact fields */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="tel"
          placeholder="Phone number (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Book button */}
      <Button
        className="w-full"
        disabled={!canBook}
        onClick={handleBook}
      >
        Book Viewing
      </Button>
    </div>
  );
}
