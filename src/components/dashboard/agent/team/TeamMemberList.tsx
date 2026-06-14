"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, MoreVertical, ChevronLeft, ChevronRight, Check, Users } from "lucide-react";
import type { AgentTeamMember, AgentBranch, TeamRole } from "@/types/agent";
import { TEAM_ROLES } from "@/types/agent";

type Props = Readonly<{
  members: AgentTeamMember[];
  branches: AgentBranch[];
}>;

type FilterState = {
  branch: string;
  role: string;
  status: string;
};

const ROLE_COLOURS: Record<TeamRole, string> = {
  admin: "bg-red-100 text-red-700",
  senior_negotiator: "bg-blue-100 text-blue-700",
  negotiator: "bg-green-100 text-green-700",
  lettings_manager: "bg-purple-100 text-purple-700",
  viewer: "bg-muted text-neutral-700",
};

const ROLE_BADGE_VARIANT: Record<TeamRole, "default" | "secondary" | "outline" | "destructive"> = {
  admin: "destructive",
  senior_negotiator: "default",
  negotiator: "secondary",
  lettings_manager: "secondary",
  viewer: "outline",
};

const ROLE_LABELS: Record<TeamRole, string> = {
  admin: "Admin",
  senior_negotiator: "Senior Negotiator",
  negotiator: "Negotiator",
  lettings_manager: "Lettings Manager",
  viewer: "Viewer",
};

const PERM_ROWS = [
  { label: "Publish Listings", description: "Ability to make listings public to portals" },
  { label: "Financial Reports", description: "View branch revenue and commission splits" },
  { label: "Delete Entities", description: "Permanent deletion of leads or properties" },
  { label: "Edit CRM Details", description: "Modify contact information for leads/contacts" },
];

const PERM_DEFAULTS: Record<"admin" | "senior" | "negotiator", boolean[]> = {
  admin:      [true, true, true, true],
  senior:     [true, true, false, true],
  negotiator: [true, false, false, true],
};

const PAGE_SIZE = 8;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getBranchName(branchId: string | null, branches: AgentBranch[]): string {
  if (!branchId) return "No branch";
  return branches.find((b) => b.id === branchId)?.name ?? "No branch";
}

export function TeamMemberList({ members: initialMembers, branches }: Props) {
  const [members, setMembers] = useState<AgentTeamMember[]>(initialMembers);
  const [filter, setFilter] = useState<FilterState>({ branch: "all", role: "all", status: "all" });
  const [page, setPage] = useState(1);

  // Invite form state (inline sidebar)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("negotiator");
  const [inviteBranch, setInviteBranch] = useState("none");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Invite dialog (mobile fallback)
  const [inviteOpen, setInviteOpen] = useState(false);

  // Change role dialog
  const [roleDialogMember, setRoleDialogMember] = useState<AgentTeamMember | null>(null);
  const [newRole, setNewRole] = useState<TeamRole>("negotiator");
  const [roleLoading, setRoleLoading] = useState(false);

  // Assign branch dialog
  const [branchDialogMember, setBranchDialogMember] = useState<AgentTeamMember | null>(null);
  const [newBranchId, setNewBranchId] = useState("none");
  const [branchLoading, setBranchLoading] = useState(false);

  // Remove dialog
  const [removeMember, setRemoveMember] = useState<AgentTeamMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const filtered = members.filter((m) => {
    if (filter.branch !== "all" && m.branch_id !== filter.branch) return false;
    if (filter.role !== "all" && m.role !== filter.role) return false;
    if (filter.status !== "all" && m.status !== filter.status) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCount = members.filter((m) => m.status === "active").length;

  async function handleInvite() {
    if (!inviteEmail || !inviteName) return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/agent/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite_member",
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
          branch_id: inviteBranch === "none" ? undefined : inviteBranch,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("negotiator");
      setInviteBranch("none");
      setInviteOpen(false);
    } catch {
      toast.error("Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleChangeRole() {
    if (!roleDialogMember) return;
    setRoleLoading(true);
    try {
      const res = await fetch("/api/agent/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roleDialogMember.id, role: newRole }),
      });
      if (!res.ok) throw new Error("Failed");
      setMembers((prev) =>
        prev.map((m) => (m.id === roleDialogMember.id ? { ...m, role: newRole } : m)),
      );
      toast.success("Role updated");
      setRoleDialogMember(null);
    } catch {
      toast.error("Failed to update role");
    } finally {
      setRoleLoading(false);
    }
  }

  async function handleAssignBranch() {
    if (!branchDialogMember) return;
    setBranchLoading(true);
    try {
      const res = await fetch("/api/agent/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: branchDialogMember.id,
          branch_id: newBranchId === "none" ? null : newBranchId,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setMembers((prev) =>
        prev.map((m) =>
          m.id === branchDialogMember.id
            ? { ...m, branch_id: newBranchId === "none" ? null : newBranchId }
            : m,
        ),
      );
      toast.success("Branch assignment updated");
      setBranchDialogMember(null);
    } catch {
      toast.error("Failed to assign branch");
    } finally {
      setBranchLoading(false);
    }
  }

  async function handleRemove() {
    if (!removeMember) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/agent/team?member_id=${removeMember.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      setMembers((prev) => prev.filter((m) => m.id !== removeMember.id));
      toast.success(`${removeMember.name} removed from team`);
      setRemoveMember(null);
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemoveLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Organisation &rsaquo; Team &amp; Branches
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
            Team Members
          </h1>
        </div>
        {/* Mobile invite trigger */}
        <Button
          className="lg:hidden"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus className="mr-2 size-4" />
          Invite Team Member
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* ─── LEFT COLUMN ─── */}
        <div className="space-y-6">

          {/* Branch Personnel card */}
          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base font-semibold">Branch Personnel</CardTitle>
                <Badge className="bg-brand-gold text-brand-gold-foreground text-xs font-bold uppercase tracking-wide">
                  {activeCount} Active Members
                </Badge>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Select value={filter.branch} onValueChange={(v) => { setFilter((f) => ({ ...f, branch: v ?? "" })); setPage(1); }}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filter.role} onValueChange={(v) => { setFilter((f) => ({ ...f, role: v ?? "" })); setPage(1); }}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {TEAM_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filter.status} onValueChange={(v) => { setFilter((f) => ({ ...f, status: v ?? "" })); setPage(1); }}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No team members found.
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-surface">
                          <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                            Team Member
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                            Role
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                            Listings
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                            Status
                          </th>
                          <th className="w-10 px-2 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((member) => (
                          <tr
                            key={member.id}
                            className="border-b border-border last:border-0 hover:bg-surface/60 transition-colors"
                          >
                            {/* Team Member */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${ROLE_COLOURS[member.role]}`}
                                >
                                  {getInitials(member.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-neutral-900 leading-tight">
                                    {member.name}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {member.email}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {getBranchName(member.branch_id, branches)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="px-4 py-3.5">
                              <Badge variant={ROLE_BADGE_VARIANT[member.role]} className="text-xs">
                                {ROLE_LABELS[member.role]}
                              </Badge>
                            </td>

                            {/* Listings */}
                            <td className="px-4 py-3.5 text-sm text-neutral-700">
                              0
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3.5">
                              <Badge
                                variant="outline"
                                className={
                                  member.status === "active"
                                    ? "border-green-500 text-green-700"
                                    : member.status === "pending"
                                      ? "border-yellow-500 text-yellow-700"
                                      : "border-neutral-400 text-neutral-500"
                                }
                              >
                                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                              </Badge>
                            </td>

                            {/* Actions */}
                            <td className="px-2 py-3.5 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                  <MoreVertical className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setRoleDialogMember(member);
                                      setNewRole(member.role);
                                    }}
                                  >
                                    Change Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setBranchDialogMember(member);
                                      setNewBranchId(member.branch_id ?? "none");
                                    }}
                                  >
                                    Assign to Branch
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setRemoveMember(member)}
                                  >
                                    Remove Member
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between border-t border-border px-5 py-3">
                    <p className="text-xs text-muted-foreground">
                      Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} members
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="size-3.5" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Role Permissions Matrix (condensed preview) */}
          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Role Permissions Matrix</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Controls access for branch-wide activities
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400 w-64">
                        Permission Action
                      </th>
                      <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                        Admin
                      </th>
                      <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                        Senior
                      </th>
                      <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                        Negotiator
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {PERM_ROWS.map((row, i) => (
                      <tr key={row.label} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-surface/40"}`}>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-sm text-neutral-900 leading-tight">{row.label}</p>
                          <p className="text-xs text-muted-foreground">{row.description}</p>
                        </td>
                        {(["admin", "senior", "negotiator"] as const).map((role) => (
                          <td key={role} className="px-4 py-3.5 text-center">
                            {PERM_DEFAULTS[role][i] ? (
                              <span className="inline-flex size-5 items-center justify-center rounded-full bg-success/10">
                                <Check className="size-3 text-success" />
                              </span>
                            ) : (
                              <span className="inline-block size-5 rounded-full border border-border" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <div className="space-y-4">
          {/* Invite Member card */}
          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <UserPlus className="size-4 text-brand-primary" />
                Invite Member
              </CardTitle>
              <p className="text-xs text-muted-foreground">Add a new agent to this branch</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700">Full Name</label>
                <input
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jonathan Smith"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700">Email Address</label>
                <input
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="jonathan@estateflow.pro"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700">Role Type</label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {branches.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700">Branch (optional)</label>
                  <Select value={inviteBranch} onValueChange={(v) => setInviteBranch(v ?? "")}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="No branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No branch</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                className="w-full bg-brand-gold text-brand-gold-foreground hover:bg-brand-gold/90 font-semibold"
                onClick={handleInvite}
                disabled={inviteLoading || !inviteEmail || !inviteName}
              >
                {inviteLoading ? "Sending..." : "Send Invitation"}
              </Button>
            </CardContent>
          </Card>

          {/* Active members summary card */}
          <Card className="rounded-xl border-0 bg-brand-primary-dark text-white shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="size-4 text-white/70" />
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">
                  Active Members
                </p>
              </div>
              <p className="font-heading text-4xl font-bold tracking-tight">
                {activeCount}
              </p>
              <p className="mt-0.5 text-sm text-white/60">members currently active</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name *</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email *</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Role</label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Branch (optional)</label>
              <Select value={inviteBranch} onValueChange={(v) => setInviteBranch(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="No branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No branch</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviteLoading || !inviteEmail || !inviteName}>
              {inviteLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={!!roleDialogMember} onOpenChange={(open) => !open && setRoleDialogMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role — {roleDialogMember?.name}</DialogTitle>
          </DialogHeader>
          <Select value={newRole} onValueChange={(v) => setNewRole((v ?? "") as TeamRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEAM_ROLES.map((r) => (
                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogMember(null)}>Cancel</Button>
            <Button onClick={handleChangeRole} disabled={roleLoading}>
              {roleLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Branch Dialog */}
      <Dialog open={!!branchDialogMember} onOpenChange={(open) => !open && setBranchDialogMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Branch — {branchDialogMember?.name}</DialogTitle>
          </DialogHeader>
          <Select value={newBranchId} onValueChange={(v) => setNewBranchId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="No branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No branch</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBranchDialogMember(null)}>Cancel</Button>
            <Button onClick={handleAssignBranch} disabled={branchLoading}>
              {branchLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member AlertDialog */}
      <AlertDialog open={!!removeMember} onOpenChange={(open) => !open && setRemoveMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeMember?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark them as inactive. They will lose access to the agency dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={removeLoading}>
              {removeLoading ? "Removing..." : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
