"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, MoreVertical } from "lucide-react";
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
  viewer: "bg-gray-100 text-gray-700",
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TeamMemberList({ members: initialMembers, branches }: Props) {
  const [members, setMembers] = useState<AgentTeamMember[]>(initialMembers);
  const [filter, setFilter] = useState<FilterState>({ branch: "all", role: "all", status: "all" });

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("negotiator");
  const [inviteBranch, setInviteBranch] = useState("none");
  const [inviteLoading, setInviteLoading] = useState(false);

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
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("negotiator");
      setInviteBranch("none");
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

  function getBranchName(branchId: string | null): string {
    if (!branchId) return "No branch";
    return branches.find((b) => b.id === branchId)?.name ?? "No branch";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 size-4" />
          Invite Team Member
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filter.branch} onValueChange={(v) => setFilter((f) => ({ ...f, branch: v ?? "" }))}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filter.role} onValueChange={(v) => setFilter((f) => ({ ...f, role: v ?? "" }))}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {TEAM_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filter.status} onValueChange={(v) => setFilter((f) => ({ ...f, status: v ?? "" }))}>
          <SelectTrigger className="w-44">
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

      {/* Members grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No team members found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <Card key={member.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-full text-sm font-semibold ${ROLE_COLOURS[member.role]}`}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreVertical className="size-4" />
                      </Button>
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
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={ROLE_BADGE_VARIANT[member.role]}>{ROLE_LABELS[member.role]}</Badge>
                  <Badge
                    variant="outline"
                    className={
                      member.status === "active"
                        ? "border-green-500 text-green-700"
                        : member.status === "pending"
                          ? "border-yellow-500 text-yellow-700"
                          : "border-gray-400 text-gray-500"
                    }
                  >
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{getBranchName(member.branch_id)}</p>
                <p className="text-xs text-muted-foreground">Leads: 0 | Viewings: 0</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Dialog */}
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
