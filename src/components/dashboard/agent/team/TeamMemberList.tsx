"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { UserPlus, MoreVertical, Users } from "lucide-react";
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

const ROLE_CONFIG: Record<TeamRole, { bg: string; text: string; label: string }> = {
  admin: { bg: "bg-error-light", text: "text-error", label: "Admin" },
  senior_negotiator: {
    bg: "bg-info-light",
    text: "text-info",
    label: "Senior Negotiator",
  },
  negotiator: {
    bg: "bg-success-light",
    text: "text-success",
    label: "Negotiator",
  },
  lettings_manager: {
    bg: "bg-brand-primary-lighter",
    text: "text-brand-primary",
    label: "Lettings Manager",
  },
  viewer: {
    bg: "bg-neutral-100",
    text: "text-neutral-500",
    label: "Viewer",
  },
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

function statusConfig(status: string): { dot: string; label: string } {
  switch (status) {
    case "active":
      return { dot: "bg-success", label: "Active" };
    case "pending":
      return { dot: "bg-warning", label: "Pending" };
    default:
      return { dot: "bg-neutral-300", label: "Inactive" };
  }
}

export function TeamMemberList({ members: initialMembers, branches }: Props) {
  const [members, setMembers] = useState<AgentTeamMember[]>(initialMembers);
  const [filter, setFilter] = useState<FilterState>({
    branch: "all",
    role: "all",
    status: "all",
  });

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("negotiator");
  const [inviteBranch, setInviteBranch] = useState("none");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Change role dialog
  const [roleDialogMember, setRoleDialogMember] =
    useState<AgentTeamMember | null>(null);
  const [newRole, setNewRole] = useState<TeamRole>("negotiator");
  const [roleLoading, setRoleLoading] = useState(false);

  // Assign branch dialog
  const [branchDialogMember, setBranchDialogMember] =
    useState<AgentTeamMember | null>(null);
  const [newBranchId, setNewBranchId] = useState("none");
  const [branchLoading, setBranchLoading] = useState(false);

  // Remove dialog
  const [removeMember, setRemoveMember] = useState<AgentTeamMember | null>(
    null,
  );
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
        prev.map((m) =>
          m.id === roleDialogMember.id ? { ...m, role: newRole } : m,
        ),
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
            ? {
                ...m,
                branch_id: newBranchId === "none" ? null : newBranchId,
              }
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
      const res = await fetch(
        `/api/agent/team?member_id=${removeMember.id}`,
        { method: "DELETE" },
      );
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
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
            Team Members
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          className="rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus className="mr-2 size-4" strokeWidth={1.25} />
          Invite Member
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filter.branch}
          onValueChange={(v) => setFilter((f) => ({ ...f, branch: v ?? "" }))}
        >
          <SelectTrigger className="w-44 rounded-lg bg-neutral-50">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filter.role}
          onValueChange={(v) => setFilter((f) => ({ ...f, role: v ?? "" }))}
        >
          <SelectTrigger className="w-44 rounded-lg bg-neutral-50">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {TEAM_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filter.status}
          onValueChange={(v) => setFilter((f) => ({ ...f, status: v ?? "" }))}
        >
          <SelectTrigger className="w-44 rounded-lg bg-neutral-50">
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
        <div className="flex flex-col items-center justify-center rounded-2xl bg-neutral-50 py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-primary-lighter">
            <Users className="size-7 text-brand-primary" strokeWidth={1.25} />
          </div>
          <p className="font-semibold text-neutral-800">No team members found</p>
          <p className="mt-1 text-sm text-neutral-500">
            Invite your first team member to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => {
            const roleCfg = ROLE_CONFIG[member.role];
            const sts = statusConfig(member.status);
            return (
              <div
                key={member.id}
                className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md"
              >
                {/* Card top */}
                <div className="flex items-start justify-between gap-3 bg-neutral-50 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${roleCfg.bg} ${roleCfg.text}`}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold leading-tight text-neutral-900">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 rounded-lg"
                      >
                        <MoreVertical className="size-4" strokeWidth={1.25} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem
                        className="rounded-lg"
                        onClick={() => {
                          setRoleDialogMember(member);
                          setNewRole(member.role);
                        }}
                      >
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-lg"
                        onClick={() => {
                          setBranchDialogMember(member);
                          setNewBranchId(member.branch_id ?? "none");
                        }}
                      >
                        Assign to Branch
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="rounded-lg text-error focus:text-error"
                        onClick={() => setRemoveMember(member)}
                      >
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Card body */}
                <div className="px-4 py-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleCfg.bg} ${roleCfg.text}`}
                    >
                      {roleCfg.label}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                      <span
                        className={`size-1.5 rounded-full ${sts.dot}`}
                      />
                      {sts.label}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {getBranchName(member.branch_id)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-semibold tracking-tight">
              Invite Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">
                Full Name *
              </label>
              <input
                className="w-full rounded-lg border-0 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-brand-primary"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">
                Email *
              </label>
              <input
                className="w-full rounded-lg border-0 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-brand-primary"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">
                Role
              </label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as TeamRole)}
              >
                <SelectTrigger className="rounded-lg bg-neutral-50">
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">
                Branch (optional)
              </label>
              <Select
                value={inviteBranch}
                onValueChange={(v) => setInviteBranch(v ?? "")}
              >
                <SelectTrigger className="rounded-lg bg-neutral-50">
                  <SelectValue placeholder="No branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No branch</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
              onClick={handleInvite}
              disabled={inviteLoading || !inviteEmail || !inviteName}
            >
              {inviteLoading ? "Sending…" : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog
        open={!!roleDialogMember}
        onOpenChange={(open) => !open && setRoleDialogMember(null)}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-semibold tracking-tight">
              Change Role — {roleDialogMember?.name}
            </DialogTitle>
          </DialogHeader>
          <Select
            value={newRole}
            onValueChange={(v) => setNewRole((v ?? "") as TeamRole)}
          >
            <SelectTrigger className="rounded-lg bg-neutral-50">
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
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setRoleDialogMember(null)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
              onClick={handleChangeRole}
              disabled={roleLoading}
            >
              {roleLoading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Branch Dialog */}
      <Dialog
        open={!!branchDialogMember}
        onOpenChange={(open) => !open && setBranchDialogMember(null)}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-semibold tracking-tight">
              Assign Branch — {branchDialogMember?.name}
            </DialogTitle>
          </DialogHeader>
          <Select
            value={newBranchId}
            onValueChange={(v) => setNewBranchId(v ?? "")}
          >
            <SelectTrigger className="rounded-lg bg-neutral-50">
              <SelectValue placeholder="No branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No branch</SelectItem>
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
              className="rounded-xl"
              onClick={() => setBranchDialogMember(null)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
              onClick={handleAssignBranch}
              disabled={branchLoading}
            >
              {branchLoading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member AlertDialog */}
      <AlertDialog
        open={!!removeMember}
        onOpenChange={(open) => !open && setRemoveMember(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-lg font-semibold tracking-tight">
              Remove {removeMember?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500">
              This will mark them as inactive. They will lose access to the
              agency dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-error text-white hover:bg-error/90"
              onClick={handleRemove}
              disabled={removeLoading}
            >
              {removeLoading ? "Removing…" : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
