"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Props = Readonly<{
  open: boolean;
  title: string;
  description: string;
  reasons: string[];
  onConfirm: (reason: string, notes?: string) => void;
  onCancel: () => void;
  confirmLabel?: string;
  isLoading?: boolean;
}>;

export function AdminConfirmModal({
  open,
  title,
  description,
  reasons,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  isLoading = false,
}: Props) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  function handleConfirm() {
    if (!reason) return;
    onConfirm(reason, notes || undefined);
    setReason("");
    setNotes("");
  }

  function handleCancel() {
    setReason("");
    setNotes("");
    onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-base font-semibold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-neutral-500">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="font-body text-sm font-medium text-foreground">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Select value={reason} onValueChange={(v) => setReason(v ?? "")}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="font-body text-sm font-medium text-foreground">
              Notes{" "}
              <span className="font-body text-xs text-neutral-400">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 font-body text-sm font-medium text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-lg bg-destructive font-body text-sm font-medium text-white hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
            onClick={handleConfirm}
            disabled={!reason || isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
