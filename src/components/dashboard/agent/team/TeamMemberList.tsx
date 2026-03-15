"use client";

import { useState, useMemo } from "react";
import type { AgentTeamMember, AgentBranch, TeamRole } from "@/types/agent";
import { TEAM_ROLES } from "@/types/agent";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  MoreVertical,
  UserMinus,
  Building2,
  Shield,
} from "lucide-react";

// ---- Role display helpers ---------------------------------------------------

const ROLE_LABELS: Record<TeamRole, string> = {
  admin: "Admin",
  senior_negotiator: "Senior Negotiator",
  negotiator: "Negotiator",
  lettings_manager: "Lettings Manager",
  viewer: "Viewer",
};

const ROLE_COLOURS: Record<TeamRole, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  senior_negotiator:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  negotiator:
    "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  lettings_manager:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  viewer:
    "bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300",
};

const STATUS_COLOURS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  inactive: "bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

// ---- Initials helper --------------------------------------------------------

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---- Props ------------------------------------------------------------------

type Props = Readonly<{
  initialMembers: AgentTeamMember[];
  branches: (AgentBranch & { member_count: number })[];
}>;

// ---- Invite form state type -------------------------------------------------

type InviteFormState = {
  email: string;
  name: string;
  role: TeamRole;
  branch_id: string | null;
};

// ---- Component --------------------------------------------------------------

export function TeamMemberList({ initialMembers, branches }: Props) {
  const [members, setMembers] = useState<AgentTeamMember[]>(initialMembers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AgentTeamMember | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Invite form
  const [invite, setInvite] = useState<InviteFormState>({
    email: "",
    name: "",
    role: "negotiator",
    branch_id: null,
  });

  // Derived filtered list
  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (filterBranch !== "all" && m.branch_id !== filterBranch) return false;
      if (filterRole !== "all" && m.role !== filterRole) return false;
      if (filterStatus !== "all" && m.status !== filterStatus) return false;
      return true;
    });
  }, [members, filterBranch, filterRole, filterStatus]);

  // Branch name lookup
  const branchMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of branches) {
      map.set(b.id, b.name);
    }
    return map;
  }, [branches]);

  // ---- Handlers -------------------------------------------------------------

  async function handleInvite() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: crypto.randomUUID(), // placeholder until real invite flow
          email: invite.email,
          name: invite.name,
          role: invite.role,
          branch_id: invite.branch_id || null,
        }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to invite");
      }

      const newMember = (await res.json()) as AgentTeamMember;
      setMembers((prev) => [newMember, ...prev]);
      setInviteOpen(false);
      setInvite({ email: "", name: "", role: "negotiator", branch_id: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: TeamRole) {
    try {
      const res = await fetch("/api/agent/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId, action: "update_role", role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      const updated = (await res.json()) as AgentTeamMember;
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleBranchAssign(memberId: string, branchId: string) {
    try {
      const res = await fetch("/api/agent/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: memberId,
          action: "assign_branch",
          branch_id: branchId,
        }),
      });
      if (!res.ok) throw new Error("Failed to assign branch");
      const updated = (await res.json()) as AgentTeamMember;
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/agent/team?id=${encodeURIComponent(removeTarget.id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to remove member");
      setMembers((prev) =>
        prev.map((m) =>
          m.id === removeTarget.id ? { ...m, status: "inactive" as const } : m,
        ),
      );
      setRemoveTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterBranch} onValueChange={(v) => setFilterBranch(v ?? "all")}>
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterRole} onValueChange={(v) => setFilterRole(v ?? "all")}>
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {TEAM_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invite button */}
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-2 size-4" />
              Invite Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation email to a new team member.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@agency.co.uk"
                  value={invite.email}
                  onChange={(e) =>
                    setInvite((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="invite-name">Full name</Label>
                <Input
                  id="invite-name"
                  placeholder="Jane Smith"
                  value={invite.name}
                  onChange={(e) =>
                    setInvite((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>Role</Label>
                <Select
                  value={invite.role}
                  onValueChange={(v) => {
                    if (v) setInvite((p) => ({ ...p, role: v as TeamRole }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {branches.length > 0 && (
                <div className="space-y-1">
                  <Label>Branch (optional)</Label>
                  <Select
                    value={invite.branch_id ?? ""}
                    onValueChange={(v) =>
                      setInvite((p) => ({ ...p, branch_id: v || null }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No branch assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No branch assigned</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setInviteOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={submitting || !invite.email || !invite.name}
              >
                {submitting ? "Sending..." : "Send Invite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Member grid */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No team members match the selected filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              branchName={member.branch_id ? branchMap.get(member.branch_id) : undefined}
              branches={branches}
              onRoleChange={handleRoleChange}
              onBranchAssign={handleBranchAssign}
              onRemove={() => setRemoveTarget(member)}
            />
          ))}
        </div>
      )}

      {/* Remove confirmation dialog */}
      <Dialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove team member?</DialogTitle>
            <DialogDescription>
              {removeTarget?.name ?? removeTarget?.email} will be set to
              inactive and lose access to the dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveTarget(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={submitting}
            >
              {submitting ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Member Card sub-component ----------------------------------------------

type MemberCardProps = Readonly<{
  member: AgentTeamMember;
  branchName: string | undefined;
  branches: (AgentBranch & { member_count: number })[];
  onRoleChange: (memberId: string, role: TeamRole) => void;
  onBranchAssign: (memberId: string, branchId: string) => void;
  onRemove: () => void;
}>;

function MemberCard({
  member,
  branchName,
  branches,
  onRoleChange,
  onBranchAssign,
  onRemove,
}: MemberCardProps) {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<TeamRole>(member.role);
  const [selectedBranch, setSelectedBranch] = useState(
    member.branch_id ?? "",
  );

  return (
    <Card className="relative">
      {/* Actions dropdown */}
      <div className="absolute right-3 top-3">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="size-7">
              <MoreVertical className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setRoleDialogOpen(true)}>
              <Shield className="mr-2 size-4" />
              Change Role
            </DropdownMenuItem>
            {branches.length > 0 && (
              <DropdownMenuItem onClick={() => setBranchDialogOpen(true)}>
                <Building2 className="mr-2 size-4" />
                Assign to Branch
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={onRemove}
              disabled={member.status === "inactive"}
            >
              <UserMinus className="mr-2 size-4" />
              Remove Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="text-sm font-medium">
              {initials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {member.name ?? "Invited user"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {member.email ?? "—"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Role & status badges */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLOURS[member.role]}`}
          >
            {ROLE_LABELS[member.role]}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLOURS[member.status] ?? ""}`}
          >
            {member.status}
          </span>
        </div>

        {/* Branch */}
        {branchName && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5" />
            {branchName}
          </p>
        )}

        {/* Performance metrics (leads / viewings — placeholders from DB would replace 0s) */}
        <div className="grid grid-cols-3 gap-2 border-t pt-3">
          <div className="text-center">
            <p className="text-lg font-semibold">0</p>
            <p className="text-xs text-muted-foreground">Leads</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">0</p>
            <p className="text-xs text-muted-foreground">Viewings</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">0</p>
            <p className="text-xs text-muted-foreground">Deals</p>
          </div>
        </div>
      </CardContent>

      {/* Change Role dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {member.name ?? member.email}.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={selectedRole}
            onValueChange={(v) => { if (v) setSelectedRole(v as TeamRole); }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEAM_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onRoleChange(member.id, selectedRole);
                setRoleDialogOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Branch dialog */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Assign to Branch</DialogTitle>
            <DialogDescription>
              Select a branch for {member.name ?? member.email}.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={selectedBranch}
            onValueChange={(v) => setSelectedBranch(v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="No branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBranchDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedBranch) {
                  onBranchAssign(member.id, selectedBranch);
                }
                setBranchDialogOpen(false);
              }}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
