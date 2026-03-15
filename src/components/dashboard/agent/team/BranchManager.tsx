"use client";

import { useState } from "react";
import type { AgentBranch, AgentTeamMember } from "@/types/agent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Pencil,
  Trash2,
  Plus,
  Users,
} from "lucide-react";

// ---- Types ------------------------------------------------------------------

type BranchWithCount = AgentBranch & { member_count: number };

type BranchFormState = {
  name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  postcode: string;
  phone: string;
  email: string;
  is_head_office: boolean;
};

const EMPTY_FORM: BranchFormState = {
  name: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  postcode: "",
  phone: "",
  email: "",
  is_head_office: false,
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
  initialBranches: BranchWithCount[];
  teamMembers: AgentTeamMember[];
}>;

// ---- Component --------------------------------------------------------------

export function BranchManager({ initialBranches, teamMembers }: Props) {
  const [branches, setBranches] = useState<BranchWithCount[]>(initialBranches);
  const [members, setMembers] = useState<AgentTeamMember[]>(teamMembers);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BranchWithCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BranchWithCount | null>(null);
  const [assignTarget, setAssignTarget] = useState<BranchWithCount | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [form, setForm] = useState<BranchFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Members assigned to a branch
  function branchMembers(branchId: string): AgentTeamMember[] {
    return members.filter(
      (m) => m.branch_id === branchId && m.status !== "inactive",
    );
  }

  // Members not yet assigned to any branch
  function unassignedMembers(): AgentTeamMember[] {
    return members.filter(
      (m) => !m.branch_id && m.status !== "inactive",
    );
  }

  // ---- Open add/edit form ---------------------------------------------------

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(branch: BranchWithCount) {
    setEditTarget(branch);
    setForm({
      name: branch.name,
      address_line_1: branch.address_line_1 ?? "",
      address_line_2: branch.address_line_2 ?? "",
      city: branch.city ?? "",
      postcode: branch.postcode ?? "",
      phone: branch.phone ?? "",
      email: branch.email ?? "",
      is_head_office: branch.is_head_office,
    });
    setError(null);
    setFormOpen(true);
  }

  // ---- Submit branch form ---------------------------------------------------

  async function handleFormSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        address_line_1: form.address_line_1 || null,
        address_line_2: form.address_line_2 || null,
        city: form.city || null,
        postcode: form.postcode || null,
        phone: form.phone || null,
        email: form.email || null,
        is_head_office: form.is_head_office,
      };

      if (editTarget) {
        const res = await fetch("/api/agent/branches", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editTarget.id, ...body }),
        });
        if (!res.ok) {
          const json = (await res.json()) as { error?: string };
          throw new Error(json.error ?? "Failed to update branch");
        }
        const updated = (await res.json()) as AgentBranch;
        setBranches((prev) =>
          prev.map((b) =>
            b.id === editTarget.id
              ? { ...updated, member_count: editTarget.member_count }
              : b,
          ),
        );
      } else {
        const res = await fetch("/api/agent/branches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const json = (await res.json()) as { error?: string };
          throw new Error(json.error ?? "Failed to create branch");
        }
        const created = (await res.json()) as AgentBranch;
        setBranches((prev) => [{ ...created, member_count: 0 }, ...prev]);
      }

      setFormOpen(false);
      setForm(EMPTY_FORM);
      setEditTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Delete branch -------------------------------------------------------

  async function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/agent/branches?id=${encodeURIComponent(deleteTarget.id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to delete branch");
      }
      setBranches((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Assign member to branch ---------------------------------------------

  async function handleAssignMember() {
    if (!assignTarget || !selectedMemberId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/agent/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedMemberId,
          action: "assign_branch",
          branch_id: assignTarget.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to assign member");
      const updated = (await res.json()) as AgentTeamMember;
      setMembers((prev) =>
        prev.map((m) => (m.id === selectedMemberId ? updated : m)),
      );
      // Increment member count on the branch
      setBranches((prev) =>
        prev.map((b) =>
          b.id === assignTarget.id
            ? { ...b, member_count: b.member_count + 1 }
            : b,
        ),
      );
      setAssignTarget(null);
      setSelectedMemberId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Form field change helper ---------------------------------------------

  function setField(key: keyof BranchFormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Add branch button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-2 size-4" />
          Add Branch
        </Button>
      </div>

      {/* Branch cards */}
      {branches.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No branches yet. Add your first branch office.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => {
            const assigned = branchMembers(branch.id);
            return (
              <Card key={branch.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="truncate text-base">
                          {branch.name}
                        </CardTitle>
                        {branch.is_head_office && (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            Head Office
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => openEdit(branch)}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Edit branch</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(branch)}
                        disabled={branch.member_count > 0}
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Delete branch</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Address */}
                  {(branch.address_line_1 || branch.city) && (
                    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        {[
                          branch.address_line_1,
                          branch.address_line_2,
                          branch.city,
                          branch.postcode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </p>
                  )}

                  {/* Contact */}
                  {branch.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="size-3.5" />
                      {branch.phone}
                    </p>
                  )}
                  {branch.email && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="size-3.5" />
                      {branch.email}
                    </p>
                  )}

                  {/* Assigned members */}
                  <div className="border-t pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-xs font-medium">
                        <Users className="size-3.5" />
                        {assigned.length} member{assigned.length !== 1 ? "s" : ""}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          setAssignTarget(branch);
                          setSelectedMemberId("");
                          setError(null);
                        }}
                        disabled={unassignedMembers().length === 0}
                      >
                        + Assign
                      </Button>
                    </div>

                    {assigned.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {assigned.map((m) => (
                          <Avatar key={m.id} className="size-7">
                            <AvatarFallback className="text-xs">
                              {initials(m.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit branch dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Branch" : "Add Branch"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Update the details for this branch."
                : "Add a new office location for your agency."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="branch-name">Branch name *</Label>
              <Input
                id="branch-name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Central London Office"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="branch-addr1">Address line 1</Label>
                <Input
                  id="branch-addr1"
                  value={form.address_line_1}
                  onChange={(e) => setField("address_line_1", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="branch-addr2">Address line 2</Label>
                <Input
                  id="branch-addr2"
                  value={form.address_line_2}
                  onChange={(e) => setField("address_line_2", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="branch-city">City</Label>
                <Input
                  id="branch-city"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="branch-postcode">Postcode</Label>
                <Input
                  id="branch-postcode"
                  value={form.postcode}
                  onChange={(e) => setField("postcode", e.target.value)}
                  placeholder="SW1A 1AA"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="branch-phone">Phone</Label>
                <Input
                  id="branch-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="branch-email">Email</Label>
                <Input
                  id="branch-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="head-office"
                checked={form.is_head_office}
                onCheckedChange={(v) => setField("is_head_office", v)}
              />
              <Label htmlFor="head-office">This is the head office</Label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={submitting || !form.name.trim()}
            >
              {submitting
                ? editTarget
                  ? "Saving..."
                  : "Creating..."
                : editTarget
                  ? "Save Changes"
                  : "Create Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete branch?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign member dialog */}
      <Dialog
        open={assignTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Member to Branch</DialogTitle>
            <DialogDescription>
              Select an unassigned team member to add to{" "}
              <strong>{assignTarget?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={selectedMemberId}
            onValueChange={(v) => setSelectedMemberId(v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a team member" />
            </SelectTrigger>
            <SelectContent>
              {unassignedMembers().map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name ?? m.email ?? m.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignTarget(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignMember}
              disabled={submitting || !selectedMemberId}
            >
              {submitting ? "Assigning..." : "Assign Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
