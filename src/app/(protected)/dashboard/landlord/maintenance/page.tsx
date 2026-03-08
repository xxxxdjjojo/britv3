"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  ArrowUpDown,
  MapPin,
  Check,
  Wrench,
  Phone,
  Mail,
  Paperclip,
  Printer,
  Send,
  HardHat,
  Star,
  MessageSquare,
  User,
  Lightbulb,
  Camera,
} from "lucide-react";

// --- Types ---

type Priority = "Urgent" | "High" | "Low";
type RequestStatus = "Reported" | "Acknowledged" | "Assigned" | "Completed";
type Category = "Plumbing" | "Electrical" | "Structural" | "General";

type MaintenanceRequest = {
  id: string;
  title: string;
  address: string;
  fullAddress: string;
  priority: Priority;
  timeAgo: string;
  tenantName: string;
  tenantInitials: string;
  tenantSince: string;
  tenantPhone: string;
  tenantEmail: string;
  category: Category;
  status: RequestStatus;
  currentStep: number;
  photos: number;
  activityLog: ActivityEntry[];
  contractors: Contractor[];
};

type ActivityEntry = {
  id: string;
  type: "system" | "note";
  title: string;
  timeAgo: string;
  author?: string;
  message: string;
};

type Contractor = {
  id: string;
  name: string;
  rating: number;
  verified: boolean;
  availability: string;
};

// --- Mock Data ---

const mockRequests: MaintenanceRequest[] = [
  {
    id: "req-1",
    title: "Kitchen Sink Leak",
    address: "124 Park Lane, Apt 4B",
    fullAddress: "124 Park Lane, Apt 4B, London, SE1 8NW",
    priority: "Urgent",
    timeAgo: "2h ago",
    tenantName: "Sarah Jenkins",
    tenantInitials: "SJ",
    tenantSince: "2022",
    tenantPhone: "+44 7700 900123",
    tenantEmail: "s.jenkins@email.co.uk",
    category: "Plumbing",
    status: "Acknowledged",
    currentStep: 2,
    photos: 4,
    activityLog: [
      {
        id: "act-1",
        type: "system",
        title: "Acknowledgment Sent",
        timeAgo: "2 hours ago",
        message:
          "Hi Sarah, thank you for reporting this issue. We have logged your request and will assign a qualified plumber shortly. Please avoid using the kitchen sink until further notice.",
      },
      {
        id: "act-2",
        type: "note",
        title: "Internal Note",
        timeAgo: "1 hour ago",
        author: "Alex R.",
        message:
          "Checked previous records — similar leak was fixed in Oct 2024. Might be a recurring pipe issue. Recommend full inspection this time.",
      },
    ],
    contractors: [
      {
        id: "con-1",
        name: "A&J Plumbing Solutions",
        rating: 4.9,
        verified: true,
        availability: "Tomorrow",
      },
      {
        id: "con-2",
        name: "FastFix Plumbing",
        rating: 4.7,
        verified: true,
        availability: "Wed 10 Mar",
      },
    ],
  },
  {
    id: "req-2",
    title: "Broken Living Room Socket",
    address: "88 Oak Road",
    fullAddress: "88 Oak Road, London, N1 4PQ",
    priority: "High",
    timeAgo: "1d ago",
    tenantName: "David Miller",
    tenantInitials: "DM",
    tenantSince: "2023",
    tenantPhone: "+44 7700 900456",
    tenantEmail: "d.miller@email.co.uk",
    category: "Electrical",
    status: "Reported",
    currentStep: 1,
    photos: 2,
    activityLog: [
      {
        id: "act-3",
        type: "system",
        title: "Request Submitted",
        timeAgo: "1 day ago",
        message:
          "Tenant reported a broken socket in the living room. Sparking noticed when plugging in appliances.",
      },
    ],
    contractors: [
      {
        id: "con-3",
        name: "Spark Right Electricians",
        rating: 4.8,
        verified: true,
        availability: "Tomorrow",
      },
    ],
  },
  {
    id: "req-3",
    title: "Garden Gate Hinge",
    address: "12 North Terrace",
    fullAddress: "12 North Terrace, London, SW3 2BL",
    priority: "Low",
    timeAgo: "3d ago",
    tenantName: "Marcus Chen",
    tenantInitials: "MC",
    tenantSince: "2021",
    tenantPhone: "+44 7700 900789",
    tenantEmail: "m.chen@email.co.uk",
    category: "Structural",
    status: "Reported",
    currentStep: 1,
    photos: 1,
    activityLog: [
      {
        id: "act-4",
        type: "system",
        title: "Request Submitted",
        timeAgo: "3 days ago",
        message:
          "Garden gate hinge has come loose. Gate is still functional but squeaks and doesn't close properly.",
      },
    ],
    contractors: [
      {
        id: "con-4",
        name: "HandyPro Services",
        rating: 4.6,
        verified: false,
        availability: "Fri 12 Mar",
      },
    ],
  },
];

// --- Helpers ---

const priorityConfig: Record<Priority, { color: string; bg: string }> = {
  Urgent: { color: "text-error", bg: "bg-error-light" },
  High: { color: "text-warning", bg: "bg-warning-light" },
  Low: { color: "text-neutral-600", bg: "bg-neutral-100" },
};

const categoryConfig: Record<Category, { color: string; bg: string }> = {
  Plumbing: { color: "text-blue-700", bg: "bg-blue-50" },
  Electrical: { color: "text-amber-700", bg: "bg-amber-50" },
  Structural: { color: "text-indigo-700", bg: "bg-indigo-50" },
  General: { color: "text-neutral-700", bg: "bg-neutral-100" },
};

const progressSteps = ["Reported", "Acknowledged", "Assigned", "Completed"];

// --- Components ---

function ProgressTracker({ currentStep }: Readonly<{ currentStep: number }>) {
  return (
    <div className="flex items-center justify-between px-4">
      {progressSteps.map((label, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const isFuture = stepNum > currentStep;

        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  isCompleted
                    ? "bg-brand-primary text-white"
                    : isActive
                      ? "bg-brand-primary text-white ring-4 ring-brand-primary/20"
                      : "border-2 border-neutral-300 text-neutral-400 opacity-50"
                }`}
              >
                {isCompleted ? <Check className="size-4" /> : stepNum}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  isFuture ? "text-neutral-400 opacity-50" : "text-foreground"
                }`}
              >
                {label}
              </span>
              <span
                className={`text-[10px] ${
                  isFuture ? "text-neutral-400 opacity-50" : "text-muted-foreground"
                }`}
              >
                {isCompleted
                  ? "Done"
                  : isActive
                    ? "In progress"
                    : "Pending"}
              </span>
            </div>
            {index < progressSteps.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 rounded-full ${
                  stepNum < currentStep
                    ? "bg-brand-primary"
                    : "bg-neutral-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InboxCard({
  request,
  isSelected,
  onClick,
}: Readonly<{
  request: MaintenanceRequest;
  isSelected: boolean;
  onClick: () => void;
}>) {
  const priority = priorityConfig[request.priority];
  const category = categoryConfig[request.category];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full cursor-pointer border-l-4 p-4 text-left transition-colors hover:bg-accent ${
        isSelected
          ? "border-l-brand-primary bg-brand-primary-lighter"
          : "border-l-transparent bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold text-foreground">
          {request.title}
        </h3>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {request.timeAgo}
        </span>
      </div>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="size-3" />
        {request.address}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${priority.bg} ${priority.color}`}
          >
            {request.priority}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${category.bg} ${category.color}`}
          >
            {request.category}
          </span>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <User className="size-3" />
        {request.tenantName}
      </p>
    </button>
  );
}

// --- Main Page ---

export default function MaintenancePage() {
  const [selectedRequestId, setSelectedRequestId] = useState(
    mockRequests[0].id,
  );
  const [noteText, setNoteText] = useState("");

  const selectedRequest =
    mockRequests.find((r) => r.id === selectedRequestId) ?? mockRequests[0];

  const priority = priorityConfig[selectedRequest.priority];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-lg border bg-white">
      {/* ── Left Panel: Inbox ── */}
      <div className="flex w-96 shrink-0 flex-col border-r">
        {/* Inbox Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-semibold">
              Active Requests
            </h2>
            <Badge variant="secondary" className="text-xs">
              {mockRequests.length}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowUpDown className="size-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="border-b px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              className="h-9 pl-9 text-sm"
            />
          </div>
        </div>

        {/* Request List */}
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {mockRequests.map((request) => (
              <InboxCard
                key={request.id}
                request={request}
                isSelected={request.id === selectedRequestId}
                onClick={() => setSelectedRequestId(request.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ── Center Panel: Details ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="space-y-6 p-6">
            {/* Progress Tracker */}
            <Card>
              <CardContent className="py-6">
                <ProgressTracker currentStep={selectedRequest.currentStep} />
              </CardContent>
            </Card>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-heading text-2xl font-bold">
                    {selectedRequest.title}
                  </h1>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${priority.bg} ${priority.color}`}
                  >
                    {selectedRequest.priority}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {selectedRequest.fullAddress}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Decline Request
                </Button>
                <Button size="sm">Move to Assigned</Button>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Tenant Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-sm">
                    Tenant Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar size="lg">
                      <AvatarFallback className="bg-brand-primary-lighter text-brand-primary font-semibold">
                        {selectedRequest.tenantInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedRequest.tenantName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tenant since {selectedRequest.tenantSince}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-3.5" />
                      <span>{selectedRequest.tenantPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-3.5" />
                      <span>{selectedRequest.tenantEmail}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Issue Photos */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading flex items-center gap-2 text-sm">
                    <Camera className="size-4 text-muted-foreground" />
                    Issue Photos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="aspect-square rounded-lg bg-muted" />
                    <div className="aspect-square rounded-lg bg-muted" />
                    <div className="relative aspect-square rounded-lg bg-muted">
                      {selectedRequest.photos > 3 && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-lg font-semibold text-white">
                          +{selectedRequest.photos - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assign Tradesperson */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-heading flex items-center gap-2 text-sm">
                  <HardHat className="size-4 text-muted-foreground" />
                  Assign Tradesperson
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search contractors..."
                      className="h-9 pl-9 text-sm"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0">
                    <Star className="mr-1.5 size-3.5" />
                    Suggest Top Rated
                  </Button>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Recommended Contractors
                  </p>
                  <div className="divide-y rounded-lg border">
                    {selectedRequest.contractors.map((contractor) => (
                      <div
                        key={contractor.id}
                        className="group flex items-center justify-between p-3 transition-colors hover:bg-accent"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-brand-primary-lighter">
                            <Wrench className="size-4 text-brand-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {contractor.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <Star className="size-3 fill-amber-400 text-amber-400" />
                                {contractor.rating}
                              </span>
                              {contractor.verified && (
                                <Badge
                                  variant="secondary"
                                  className="h-4 px-1.5 text-[10px]"
                                >
                                  Verified Professional
                                </Badge>
                              )}
                              <span>
                                Available ({contractor.availability})
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-heading flex items-center gap-2 text-sm">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-6 pl-6">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-neutral-200" />

                  {selectedRequest.activityLog.map((entry) => (
                    <div key={entry.id} className="relative">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-6 top-0.5 size-3.5 rounded-full border-2 ${
                          entry.type === "system"
                            ? "border-brand-primary bg-brand-primary"
                            : "border-neutral-400 bg-white"
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {entry.title}
                            {entry.author && (
                              <span className="text-muted-foreground">
                                {" "}
                                by {entry.author}
                              </span>
                            )}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {entry.timeAgo}
                          </span>
                        </div>
                        <div
                          className={`mt-2 rounded-md border p-3 text-sm ${
                            entry.type === "note"
                              ? "border-neutral-200 bg-neutral-50 italic text-muted-foreground"
                              : "border-neutral-200 text-muted-foreground"
                          }`}
                        >
                          {entry.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Bottom Action Bar */}
        <div className="flex items-center gap-3 border-t bg-white px-6 py-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8">
              <Paperclip className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8">
              <Printer className="size-4" />
            </Button>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <Input
              placeholder="Add an internal note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="h-9 text-sm"
            />
            <Button size="sm" className="shrink-0">
              <Send className="mr-1.5 size-3.5" />
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Context ── */}
      <div className="hidden w-72 shrink-0 flex-col border-l xl:flex">
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {/* Map Placeholder */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-sm">Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted">
                  <MapPin className="size-8 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedRequest.fullAddress}
                </p>
              </CardContent>
            </Card>

            {/* Property Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-sm">
                  Property Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Rent Status</dt>
                    <dd className="font-medium text-success">Paid</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Last Inspection</dt>
                    <dd className="font-medium">June 2023</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">
                      Maintenance Score
                    </dt>
                    <dd className="font-medium text-warning">Fair</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Pro Tip */}
            <div className="rounded-lg bg-brand-primary-lighter p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand-primary" />
                <div>
                  <p className="text-xs font-semibold text-brand-primary">
                    PRO TIP
                  </p>
                  <p className="mt-1 text-xs text-brand-primary/80">
                    Consider batching non-urgent maintenance requests for the
                    same property to reduce contractor visit costs and minimise
                    tenant disruption.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
