"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Pencil, Trash2, MapPin, Phone, Mail } from "lucide-react";
import type { AgentBranch, AgentTeamMember } from "@/types/agent";

type Props = Readonly<{
  branches: AgentBranch[];
  members: AgentTeamMember[];
}>;

type BranchFormData = {
  name: string;
  address_line_1: string;
  city: string;
  postcode: string;
  phone: string;
  email: string;
  is_head_office: boolean;
};

const EMPTY_FORM: BranchFormData = {
  name: "",
  address_line_1: "",
  city: "",
  postcode: "",
  phone: "",
  email: "",
  is_head_office: false,
};

const AVATAR_COLOURS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function avatarColour(index: number): string {
  return AVATAR_COLOURS[index % AVATAR_COLOURS.length];
}

export function BranchManager({ branches: initialBranches, members }: Props) {
  const [branches, setBranches] = useState<AgentBranch[]>(initialBranches);

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<BranchFormData>(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);

  // Edit dialog
  const [editBranch, setEditBranch] = useState<AgentBranch | null>(null);
  const [editForm, setEditForm] = useState<BranchFormData>(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog
  const [deleteBranch, setDeleteBranch] = useState<AgentBranch | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function getBranchMembers(branchId: string): AgentTeamMember[] {
    return members.filter((m) => m.branch_id === branchId && m.status !== "inactive");
  }

  async function handleAssignMember(branchId: string, memberId: string) {
    if (!memberId || memberId === "none") return;
    try {
      const res = await fetch("/api/agent/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_branch", member_id: memberId, branch_id: branchId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Member assigned to branch");
    } catch {
      toast.error("Failed to assign member");
    }
  }

  async function handleAdd() {
    if (!addForm.name) return;
    setAddLoading(true);
    try {
      const res = await fetch("/api/agent/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_branch", ...addForm }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { branch?: AgentBranch };
      if (data.branch) {
        setBranches((prev) => [...prev, data.branch!]);
      }
      toast.success(`Branch "${addForm.name}" created`);
      setAddOpen(false);
      setAddForm(EMPTY_FORM);
    } catch {
      toast.error("Failed to create branch");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleEdit() {
    if (!editBranch) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/agent/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editBranch.id, ...editForm }),
      });
      if (!res.ok) throw new Error("Failed");
      setBranches((prev) =>
        prev.map((b) =>
          b.id === editBranch.id
            ? {
                ...b,
                name: editForm.name,
                address_line_1: editForm.address_line_1 || null,
                city: editForm.city || null,
                postcode: editForm.postcode || null,
                phone: editForm.phone || null,
                email: editForm.email || null,
                is_head_office: editForm.is_head_office,
              }
            : b,
        ),
      );
      toast.success("Branch updated");
      setEditBranch(null);
    } catch {
      toast.error("Failed to update branch");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteBranch) return;
    const branchMembers = getBranchMembers(deleteBranch.id);
    if (branchMembers.length > 0) {
      toast.error("Remove all members before deleting this branch");
      setDeleteBranch(null);
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/agent/team?branch_id=${deleteBranch.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      setBranches((prev) => prev.filter((b) => b.id !== deleteBranch.id));
      toast.success("Branch deleted");
      setDeleteBranch(null);
    } catch {
      toast.error("Failed to delete branch");
    } finally {
      setDeleteLoading(false);
    }
  }

  const unassignedMembers = members.filter((m) => !m.branch_id && m.status !== "inactive");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Organisation &rsaquo; Team &amp; Branches
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
            Branch Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {branches.length} branch{branches.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Button
          className="shrink-0"
          onClick={() => { setAddForm(EMPTY_FORM); setAddOpen(true); }}
        >
          <Plus className="mr-2 size-4" />
          Add Branch
        </Button>
      </div>

      {branches.length === 0 ? (
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-surface">
              <Building2 className="size-7 text-neutral-400" />
            </div>
            <p className="font-semibold text-neutral-700">No branches yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first branch to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => {
            const branchMembers = getBranchMembers(branch.id);
            const addressParts = [branch.address_line_1, branch.city, branch.postcode].filter(Boolean);
            return (
              <Card key={branch.id} className="rounded-xl border-border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base font-semibold leading-tight">
                          {branch.name}
                        </CardTitle>
                        {branch.is_head_office && (
                          <Badge className="bg-brand-gold text-brand-gold-foreground text-[10px] font-bold uppercase tracking-wide">
                            Head Office
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-neutral-900"
                        onClick={() => {
                          setEditBranch(branch);
                          setEditForm({
                            name: branch.name,
                            address_line_1: branch.address_line_1 ?? "",
                            city: branch.city ?? "",
                            postcode: branch.postcode ?? "",
                            phone: branch.phone ?? "",
                            email: branch.email ?? "",
                            is_head_office: branch.is_head_office,
                          });
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteBranch(branch)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Contact details */}
                  <div className="space-y-1.5">
                    {addressParts.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground leading-tight">{addressParts.join(", ")}</p>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{branch.phone}</p>
                      </div>
                    )}
                    {branch.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{branch.email}</p>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Member count + avatars */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-neutral-700">
                        {branchMembers.length} member{branchMembers.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {branchMembers.length > 0 && (
                      <div className="flex -space-x-2">
                        {branchMembers.slice(0, 5).map((m, i) => (
                          <div
                            key={m.id}
                            title={m.name}
                            className={`flex size-7 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-white ${avatarColour(i)}`}
                          >
                            {getInitials(m.name)}
                          </div>
                        ))}
                        {branchMembers.length > 5 && (
                          <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-white text-muted-foreground">
                            +{branchMembers.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Assign unassigned member */}
                  {unassignedMembers.length > 0 && (
                    <Select onValueChange={(memberId: string | null) => memberId && handleAssignMember(branch.id, memberId)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Assign member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unassignedMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Branch Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Branch</DialogTitle>
          </DialogHeader>
          <BranchForm form={addForm} onChange={setAddForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addLoading || !addForm.name}>
              {addLoading ? "Creating..." : "Create Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={!!editBranch} onOpenChange={(open) => !open && setEditBranch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Branch — {editBranch?.name}</DialogTitle>
          </DialogHeader>
          <BranchForm form={editForm} onChange={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBranch(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editLoading || !editForm.name}>
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch AlertDialog */}
      <AlertDialog open={!!deleteBranch} onOpenChange={(open) => !open && setDeleteBranch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteBranch?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All member assignments will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? "Deleting..." : "Delete Branch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BranchForm({
  form,
  onChange,
}: Readonly<{
  form: BranchFormData;
  onChange: (f: BranchFormData) => void;
}>) {
  function set(field: keyof BranchFormData, value: string | boolean) {
    onChange({ ...form, [field]: value });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Branch Name *</label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. London City Branch"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Address Line 1</label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={form.address_line_1}
          onChange={(e) => set("address_line_1", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">City</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Postcode</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.postcode}
            onChange={(e) => set("postcode", e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Phone</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_head_office"
          checked={form.is_head_office}
          onChange={(e) => set("is_head_office", e.target.checked)}
          className="size-4"
        />
        <label htmlFor="is_head_office" className="text-sm font-medium">Head Office</label>
      </div>
    </div>
  );
}
