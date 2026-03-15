import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, TrendingUp, Clock } from "lucide-react";
import { getAgentLeads } from "@/services/agent/agent-lead-service";
import type { AgentLead, LeadStage } from "@/types/agent";

const STAGE_COLORS: Record<LeadStage, "default" | "secondary" | "outline" | "destructive"> = {
  new_enquiry: "outline",
  qualified: "secondary",
  viewing_booked: "default",
  offer_made: "default",
  closed: "destructive",
};

const STAGE_LABELS: Record<LeadStage, string> = {
  new_enquiry: "New Enquiry",
  qualified: "Qualified",
  viewing_booked: "Viewing Booked",
  offer_made: "Offer Made",
  closed: "Closed",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let leads: AgentLead[] = [];
  try {
    leads = await getAgentLeads(supabase, user.id);
  } catch {
    leads = [];
  }

  const newEnquiries = leads.filter((l) => l.stage === "new_enquiry").length;
  const viewingsBooked = leads.filter((l) => l.stage === "viewing_booked").length;
  const offersMade = leads.filter((l) => l.stage === "offer_made").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads & Pipeline</h1>
          <p className="text-muted-foreground">
            Manage client enquiries and track your sales pipeline
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 size-4" />
          Add Lead
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Leads</CardDescription>
            <CardTitle className="text-3xl">{leads.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="size-3" />
              {leads.length} in pipeline
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New Enquiries</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{newEnquiries}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Viewings Booked</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{viewingsBooked}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Offers Made</CardDescription>
            <CardTitle className="text-3xl text-green-600">{offersMade}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserPlus className="size-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No leads yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first lead to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Leads</CardTitle>
            <CardDescription>Sorted by most recent activity</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(l.contact_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{l.contact_name}</p>
                          {l.contact_email && (
                            <p className="text-xs text-muted-foreground">{l.contact_email}</p>
                          )}
                          {l.contact_phone && (
                            <p className="text-xs text-muted-foreground">{l.contact_phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{l.source.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STAGE_COLORS[l.stage] ?? "secondary"}>
                        {STAGE_LABELS[l.stage] ?? l.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="size-3" />
                        {formatDate(l.updated_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
