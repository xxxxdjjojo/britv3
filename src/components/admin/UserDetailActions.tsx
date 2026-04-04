"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminConfirmModal } from "@/components/admin/AdminConfirmModal";
import { useAdminAction } from "@/hooks/useAdminAction";
import { toast } from "sonner";

const SUSPEND_REASONS = [
  "Spam",
  "Abuse",
  "Policy violation",
  "Fraud",
  "Other",
];

const BAN_REASONS = [
  "Serious policy violation",
  "Fraud/Scam",
  "Illegal content",
  "Repeated violations",
  "Other",
];

type ModalType = "suspend" | "ban" | null;

type Props = Readonly<{
  userId: string;
  isSuspended: boolean;
  isBanned: boolean;
}>;

export function UserDetailActions({ userId, isSuspended, isBanned }: Props) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const { execute, isPending } = useAdminAction();

  async function handleSuspend(reason: string) {
    const ok = await execute(`/api/admin/users/${userId}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (ok) {
      toast.success("User suspended");
      setActiveModal(null);
    }
  }

  async function handleBan(reason: string) {
    const ok = await execute(`/api/admin/users/${userId}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (ok) {
      toast.success("User banned");
      setActiveModal(null);
    }
  }

  async function handleActivate() {
    const ok = await execute(`/api/admin/users/${userId}/activate`, {
      method: "POST",
    });
    if (ok) {
      toast.success("User activated");
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {isBanned || isSuspended ? (
          <Button
            variant="outline"
            className="w-full justify-start border-success/20 font-body text-sm font-medium text-success hover:bg-success-light dark:border-success/30 dark:text-success dark:hover:bg-success/10 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
            onClick={handleActivate}
            disabled={isPending}
          >
            Activate Account
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              className="w-full justify-start border-warning/20 font-body text-sm font-medium text-warning hover:bg-warning-light dark:border-warning/30 dark:text-warning dark:hover:bg-warning/10 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
              onClick={() => setActiveModal("suspend")}
              disabled={isPending}
            >
              Suspend User
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-error/20 font-body text-sm font-medium text-error hover:bg-error-light dark:border-error/30 dark:text-error dark:hover:bg-error/10 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
              onClick={() => setActiveModal("ban")}
              disabled={isPending}
            >
              Ban User
            </Button>
          </>
        )}
      </div>

      <AdminConfirmModal
        open={activeModal === "suspend"}
        title="Suspend User"
        description="The user will be temporarily blocked from accessing their account."
        reasons={SUSPEND_REASONS}
        confirmLabel="Suspend"
        isLoading={isPending}
        onConfirm={handleSuspend}
        onCancel={() => setActiveModal(null)}
      />

      <AdminConfirmModal
        open={activeModal === "ban"}
        title="Ban User"
        description="This is a permanent action. The user will be permanently blocked from the platform."
        reasons={BAN_REASONS}
        confirmLabel="Ban Permanently"
        isLoading={isPending}
        onConfirm={handleBan}
        onCancel={() => setActiveModal(null)}
      />
    </>
  );
}
