"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

function ActivityIcon({ type }: Readonly<{ type: string }>) {
  switch (type) {
    case "note":
    case "note_added":
      return (
        <div className="flex items-center justify-center size-8 rounded-full bg-blue-100 text-blue-600 shrink-0">
          <MessageSquare className="size-4" />
        </div>
      );
    case "lead_assigned":
      return (
        <div className="flex items-center justify-center size-8 rounded-full bg-green-100 text-green-600 shrink-0">
          <UserCheck className="size-4" />
        </div>
      );
    case "stage_changed":
      return (
        <div className="flex items-center justify-center size-8 rounded-full bg-amber-100 text-amber-600 shrink-0">
          <ArrowRight className="size-4" />
        </div>
      );
    case "lead_created":
    default:
      return (
        <div className="flex items-center justify-center size-8 rounded-full bg-muted text-muted-foreground shrink-0">
          <Plus className="size-4" />
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
      // fail silently
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

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Activity timeline — left col */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {localActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity yet.
              </p>
            ) : (
              <ol className="space-y-4">
                {localActivities.map((activity) => (
                  <li key={activity.id} className="flex gap-3">
                    <ActivityIcon type={activity.activity_type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {activity.description ?? activity.activity_type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
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

            <form onSubmit={handleAddNote} className="mt-6 space-y-2">
              <Textarea
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
              />
              <Button
                type="submit"
                size="sm"
                disabled={isAddingNote || !noteText.trim()}
              >
                <MessageSquare className="mr-2 size-4" />
                {isAddingNote ? "Adding..." : "Add Note"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Contact info & actions — right col */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{lead.contact_name}</h2>
            </div>

            {lead.contact_email && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <a
                  href={`mailto:${lead.contact_email}`}
                  className="text-sm text-primary hover:underline break-all"
                >
                  {lead.contact_email}
                </a>
              </div>
            )}

            {lead.contact_phone && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                <a
                  href={`tel:${lead.contact_phone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {lead.contact_phone}
                </a>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Badge>{STAGE_LABELS[currentStage]}</Badge>
              {lead.source && (
                <Badge variant="outline">
                  {lead.source.charAt(0).toUpperCase() +
                    lead.source.slice(1).replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Stage</p>
              <Select
                value={currentStage}
                onValueChange={(v) => handleStageChange(v as LeadStage)}
              >
                <SelectTrigger>
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
              <p className="text-xs text-muted-foreground">Assigned to</p>
              <Select
                value={currentAssignedTo}
                onValueChange={handleAssignedToChange}
              >
                <SelectTrigger>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {lead.contact_email && (
              <Button variant="outline" asChild>
                <a href={`mailto:${lead.contact_email}`}>
                  <Mail className="mr-2 size-4" />
                  Send Email
                </a>
              </Button>
            )}
            <Button variant="outline" asChild>
              <a href="/dashboard/agent/viewings">
                <Calendar className="mr-2 size-4" />
                Book Viewing
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
