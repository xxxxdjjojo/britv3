"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function DangerZone() {
  const router = useRouter();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleDeactivate() {
    if (deleteConfirmation !== "DELETE") return;

    setDeleting(true);
    try {
      const response = await fetch("/api/gdpr/delete", { method: "POST" });

      if (!response.ok) {
        const data: unknown = await response.json();
        const errorMsg =
          data !== null &&
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Deletion failed";
        throw new Error(errorMsg);
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Account scheduled for deletion");
      setDialogOpen(false);
      setDeleteConfirmation("");
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to process deletion request",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm" className="mt-2">
            <Trash2 className="size-4" />
            Deactivate Account
          </Button>
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This will schedule your account for permanent deletion. All your
            data will be removed after a 30-day grace period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="deactivate-confirmation">
            Type <strong>DELETE</strong> to confirm
          </Label>
          <Input
            id="deactivate-confirmation"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="Type DELETE"
            className="font-mono"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setDialogOpen(false);
              setDeleteConfirmation("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeactivate}
            disabled={deleteConfirmation !== "DELETE" || deleting}
          >
            {deleting ? "Deleting..." : "Deactivate Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
