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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function BranchManager({ branches: initialBranches, members }: Props) {
  const [branches, setBranches] = useState<AgentBranch[]>(initialBranches);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<BranchFormData>(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);

  const [editBranch, setEditBranch] = useState<AgentBranch | null>(null);
  const [editForm, setEditForm] = useState<BranchFormData>(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteBranch, setDeleteBranch] = useState<AgentBranch | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function getBranchMembers(branchId: string): AgentTeamMember[] {
    return members.filter(
      (m) => m.branch_id === branchId && m.status !== "inactive",
    );
  }

  async function handleAssignMember(branchId: string, memberId: string) {
    if (!memberId || memberId === "none") return;
    try {
      const res = await fetch("/api/agent/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_branch",
          member_id: memberId,
          branch_id: branchId,
        }),
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
      const res = await fetch(
        `/api/agent/team?branch_id=${deleteBranch.id}`,
        { method: "DELETE" },
      );
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

  const unassignedMembers = members.filter(
    (m) => !m.branch_id && m.status !== "inactive",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
            Branch Management
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {branches.length} branch{branches.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Button
          className="rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
          onClick={() => {
            setAddForm(EMPTY_FORM);
            setAddOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Add Branch
        </Button>
      </div>

      {branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-neutral-50 py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-primary-lighter">
            <Building2 className="size-7 text-brand-primary" />
          </div>
          <p className="font-semibold text-neutral-800">No branches yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            Add your first branch to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => {
            const branchMembers = getBranchMembers(branch.id);
            const addressParts = [
              branch.address_line_1,
              branch.city,
              branch.postcode,
            ].filter(Boolean);
            return (
              <div
                key={branch.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2 bg-neutral-50 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary-lighter">
                      <Building2 className="size-5 text-brand-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {branch.name}
                      </p>
                      {branch.is_head_office && (
                        <span className="mt-0.5 inline-flex rounded-full bg-brand-primary px-2 py-px text-[10px] font-semibold text-white">
                          Head Office
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-neutral-400 hover:text-neutral-700"
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
                      className="size-8 rounded-lg text-neutral-400 hover:text-error"
                      onClick={() => setDeleteBranch(branch)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-4 py-3 space-y-3">
                  {addressParts.length > 0 && (
                    <div className="flex items-start gap-2 text-xs text-neutral-500">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-neutral-400" />
                      <span>{addressParts.join(", ")}</span>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Phone className="size-3.5 shrink-0 text-neutral-400" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                  {branch.email && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Mail className="size-3.5 shrink-0 text-neutral-400" />
                      <span>{branch.email}</span>
                    </div>
                  )}

                  {/* Member avatars */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-neutral-500">
                      {branchMembers.length} member
                      {branchMembers.length !== 1 ? "s" : ""}
                    </p>
                    {branchMembers.length > 0 && (
                      <div className="flex -space-x-1.5">
                        {branchMembers.slice(0, 5).map((m) => (
                          <div
                            key={m.id}
                            title={m.name}
                            className="flex size-7 items-center justify-center rounded-full bg-brand-primary-lighter text-[10px] font-bold text-brand-primary ring-2 ring-white"
                          >
                            {getInitials(m.name)}
                          </div>
                        ))}
                        {branchMembers.length > 5 && (
                          <div className="flex size-7 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-500 ring-2 ring-white">
                            +{branchMembers.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Assign unassigned member */}
                  {unassignedMembers.length > 0 && (
                    <Select
                      onValueChange={(memberId: string | null) =>
                        memberId && handleAssignMember(branch.id, memberId)
                      }
                    >
                      <SelectTrigger className="h-8 rounded-lg bg-neutral-50 text-xs">
                        <SelectValue placeholder="Assign member…" />
                      </SelectTrigger>
                      <SelectContent>
                        {unassignedMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Branch Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-semibold tracking-tight">
              Add Branch
            </DialogTitle>
          </DialogHeader>
          <BranchForm form={addForm} onChange={setAddForm} />
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
              onClick={handleAdd}
              disabled={addLoading || !addForm.name}
            >
              {addLoading ? "Creating…" : "Create Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog
        open={!!editBranch}
        onOpenChange={(open) => !open && setEditBranch(null)}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-semibold tracking-tight">
              Edit Branch — {editBranch?.name}
            </DialogTitle>
          </DialogHeader>
          <BranchForm form={editForm} onChange={setEditForm} />
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setEditBranch(null)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
              onClick={handleEdit}
              disabled={editLoading || !editForm.name}
            >
              {editLoading ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch AlertDialog */}
      <AlertDialog
        open={!!deleteBranch}
        onOpenChange={(open) => !open && setDeleteBranch(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-lg font-semibold tracking-tight">
              Delete {deleteBranch?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500">
              This action cannot be undone. All member assignments will be
              cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-error text-white hover:bg-error/90"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting…" : "Delete Branch"}
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

  const inputClass =
    "w-full rounded-lg border-0 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-primary";
  const labelClass = "text-sm font-medium text-neutral-700";

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className={labelClass}>Branch Name *</label>
        <input
          className={inputClass}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. London City Branch"
        />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>Address Line 1</label>
        <input
          className={inputClass}
          value={form.address_line_1}
          onChange={(e) => set("address_line_1", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelClass}>City</label>
          <input
            className={inputClass}
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Postcode</label>
          <input
            className={inputClass}
            value={form.postcode}
            onChange={(e) => set("postcode", e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelClass}>Phone</label>
          <input
            className={inputClass}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Email</label>
          <input
            className={inputClass}
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-neutral-50 px-4 py-3 transition-colors hover:bg-brand-primary-lighter/50">
        <input
          type="checkbox"
          checked={form.is_head_office}
          onChange={(e) => set("is_head_office", e.target.checked)}
          className="size-4 rounded accent-brand-primary"
        />
        <span className="text-sm font-medium text-neutral-700">
          Head Office
        </span>
      </label>
    </div>
  );
}
