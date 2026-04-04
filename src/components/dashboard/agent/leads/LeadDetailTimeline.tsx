"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  UserCheck,
  ArrowRight,
  Plus,
  Mail,
  Calendar,
  ArrowLeft,
  Phone,
} from "lucide-react";
import type {
  AgentLead,
  AgentLeadActivity,
  AgentTeamMember,
  LeadStage,
} from "@/types/agent";
import { LEAD_STAGES } from "@/types/agent";

type Props = Readonly<{
  lead: AgentLead;
  activities: AgentLeadActivity[];
  teamMembers: AgentTeamMember[];
  userId: string;
}>;

const STAGE_LABELS: Record<LeadStage, string> = {
  new_enquiry: "New Enquiry",
  qualified: "Qualified",
  viewing_booked: "Viewing Booked",
  offer_made: "Offer Made",
  closed: "Closed",
};

const STAGE_COLORS: Record<LeadStage, string> = {
  new_enquiry: "bg-muted text-muted-foreground",
  qualified: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/10 dark:text-brand-accent",
  viewing_booked: "bg-warning-light text-warning dark:bg-warning/10 dark:text-warning",
  offer_made: "bg-success-light text-success dark:bg-success/10 dark:text-success",
  closed: "bg-muted text-muted-foreground",
};

function ActivityIcon({ type }: Readonly<{ type: string }>) {
  switch (type) {
    case "note":
    case "note_added":
      return (
        <div className="flex items-center justify-center size-8 rounded-full bg-info-light text-info shrink-0">
          <MessageSquare className="size-4" strokeWidth={1.25} />
        </div>
      );
    case "lead_assigned":
      return (
        <div className="flex items-center justify-center size-8 rounded-full bg-accent text-accent-foreground shrink-0">
          <UserCheck className="size-4" strokeWidth={1.25} />
        </div>
      );
    case "stage_changed":
      return (
        <div className="flex items-center justify-center size-8 rounded-full bg-warning-light text-warning shrink-0">
          <ArrowRight className="size-4" strokeWidth={1.25} />
        </div>
      );
    case "lead_created":
    default:
      return (
        <div className="flex items-center justify-center size-8 rounded-full bg-muted text-muted-foreground shrink-0">
          <Plus className="size-4" strokeWidth={1.25} />
        </div>
      );
  }
}

export function LeadDetailTimeline({
  lead,
  activities,
  teamMembers,
  userId,
}: Props) {
  const [noteText, setNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [localActivities, setLocalActivities] =
    useState<AgentLeadActivity[]>(activities);
  const [currentStage, setCurrentStage] = useState<LeadStage>(lead.stage);
  const [currentAssignedTo, setCurrentAssignedTo] = useState<string>(
    lead.assigned_to ?? "",
  );

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await fetch("/api/agent/leads/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          activity_type: "note_added",
          description: noteText,
        }),
      });
      if (res.ok) {
        const newActivity = (await res.json()) as AgentLeadActivity;
        setLocalActivities((prev) => [...prev, newActivity]);
        setNoteText("");
      }
    } catch {
      toast.error("Failed to add note");
    } finally {
      setIsAddingNote(false);
    }
  }

  async function handleStageChange(newStage: string | null) {
    if (!newStage) return;
    setCurrentStage(newStage as LeadStage);
    try {
      await fetch("/api/agent/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, stage: newStage }),
      });
    } catch {
      setCurrentStage(lead.stage);
    }
  }

  async function handleAssignedToChange(assigneeId: string | null) {
    const value = assigneeId ?? "";
    setCurrentAssignedTo(value);
    try {
      await fetch("/api/agent/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, assigned_to: value }),
      });
    } catch {
      setCurrentAssignedTo(lead.assigned_to ?? "");
    }
  }

  // Avatar initials
  const initials = lead.contact_name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const stageColorClass = STAGE_COLORS[currentStage];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/agent/leads"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-primary transition-colors"
      >
        <ArrowLeft className="size-4" strokeWidth={1.25} />
        Back to Pipeline
      </Link>

      {/* Lead header card */}
      <div className="rounded-2xl bg-card shadow-sm overflow-hidden ring-1 ring-border/60">
        <div className="h-1.5 bg-brand-primary" />
        <div className="flex items-start gap-4 p-6">
          {/* Avatar */}
          <div className="size-14 rounded-2xl bg-accent flex items-center justify-center shrink-0 text-accent-foreground font-bold text-lg">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
              {lead.contact_name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stageColorClass}`}>
                {STAGE_LABELS[currentStage]}
              </span>
              {lead.source && (
                <span className="text-xs text-muted-foreground">
                  via {lead.source.charAt(0).toUpperCase() + lead.source.slice(1).replace(/_/g, " ")}
                </span>
              )}
            </div>
            {(lead.contact_email || lead.contact_phone) && (
              <div className="mt-2 flex flex-wrap gap-3">
                {lead.contact_email && (
                  <a
                    href={`mailto:${lead.contact_email}`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-primary transition-colors"
                  >
                    <Mail className="size-3.5" strokeWidth={1.25} />
                    {lead.contact_email}
                  </a>
                )}
                {lead.contact_phone && (
                  <a
                    href={`tel:${lead.contact_phone}`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-primary transition-colors"
                  >
                    <Phone className="size-3.5" strokeWidth={1.25} />
                    {lead.contact_phone}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity timeline — left/main col */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="size-6 rounded-lg bg-accent flex items-center justify-center">
                  <MessageSquare className="size-3.5 text-accent-foreground" strokeWidth={1.25} />
                </div>
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {localActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <MessageSquare className="size-6 text-muted-foreground" strokeWidth={1.25} />
                  </div>
                  <p className="text-sm font-medium text-foreground">No activity yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a note below to log your first interaction.
                  </p>
                </div>
              ) : (
                <ol className="relative space-y-0">
                  {localActivities.map((activity, i) => (
                    <li key={activity.id} className="flex gap-3 pb-5 relative">
                      {/* Connector line */}
                      {i < localActivities.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-0 w-px bg-border/60" />
                      )}
                      <ActivityIcon type={activity.activity_type} />
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm text-foreground leading-snug">
                          {activity.description ?? activity.activity_type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.actor_id === userId
                            ? "You"
                            : activity.actor_id.slice(0, 8) + "…"}{" "}
                          &middot;{" "}
                          {new Date(activity.created_at).toLocaleString("en-GB")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {/* Add note form */}
              <div className="mt-4 pt-4">
                <div className="mb-4 h-px bg-border/60" />
                <form onSubmit={handleAddNote} className="space-y-2.5">
                  <Textarea
                    placeholder="Add a note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={3}
                    className="bg-muted/50 border-border text-sm focus:bg-background focus:border-ring transition-colors resize-none rounded-xl"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isAddingNote || !noteText.trim()}
                    className="bg-brand-primary hover:bg-brand-primary-light text-white gap-1.5 h-8"
                  >
                    <MessageSquare className="size-3.5" strokeWidth={1.25} />
                    {isAddingNote ? "Adding..." : "Add Note"}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Pipeline card */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Stage
                </p>
                <Select
                  value={currentStage}
                  onValueChange={(v) => handleStageChange(v as LeadStage)}
                >
                  <SelectTrigger className="bg-muted/50 border-border focus:border-ring">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {STAGE_LABELS[stage]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Assigned to
                </p>
                <Select
                  value={currentAssignedTo}
                  onValueChange={handleAssignedToChange}
                >
                  <SelectTrigger className="bg-muted/50 border-border focus:border-ring">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.user_id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions card */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {lead.contact_email && (
                <Button
                  variant="outline"
                  className="justify-start hover:border-brand-primary hover:text-brand-primary transition-colors"
                  asChild
                >
                  <a href={`mailto:${lead.contact_email}`}>
                    <Mail className="mr-2 size-4" strokeWidth={1.25} />
                    Send Email
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                className="justify-start hover:border-brand-primary hover:text-brand-primary transition-colors"
                asChild
              >
                <Link href="/dashboard/agent/viewings">
                  <Calendar className="mr-2 size-4" strokeWidth={1.25} />
                  Book Viewing
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
