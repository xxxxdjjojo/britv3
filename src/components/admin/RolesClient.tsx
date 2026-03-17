"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Users } from "lucide-react";

type RoleCount = { role: string; count: number };

type Props = Readonly<{ roleCounts: RoleCount[] }>;

const ROLE_LABELS: Record<string, string> = {
  homebuyer: "Homebuyer",
  renter: "Renter",
  seller: "Seller",
  landlord: "Landlord",
  estate_agent: "Estate Agent",
  service_provider: "Service Provider",
  admin: "Admin",
};

const DEMOTE_ROLES = ["homebuyer", "renter", "seller", "landlord", "estate_agent", "service_provider"];

function PromoteDemoteForm() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState<"promote" | "demote">("promote");
  const [demoteTo, setDemoteTo] = useState("homebuyer");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim()) return;
    const endpoint =
      action === "promote"
        ? `/api/admin/roles/${encodeURIComponent(userId.trim())}/promote`
        : `/api/admin/roles/${encodeURIComponent(userId.trim())}/demote`;
    const body = action === "demote" ? { role: demoteTo } : undefined;

    startTransition(async () => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Action failed");
        }
        toast.success(
          action === "promote"
            ? "User promoted to admin"
            : `User demoted to ${ROLE_LABELS[demoteTo] ?? demoteTo}`,
        );
        setUserId("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-neutral-200 rounded-lg bg-white mb-6">
      <h3 className="text-sm font-semibold text-neutral-700 mb-3">
        Change User Role
      </h3>
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User ID (UUID)"
          className="h-8 text-sm max-w-xs font-mono"
        />
        <Select value={action} onValueChange={(v) => setAction(v as "promote" | "demote")}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="promote">Promote to admin</SelectItem>
            <SelectItem value="demote">Demote from admin</SelectItem>
          </SelectContent>
        </Select>
        {action === "demote" && (
          <Select value={demoteTo} onValueChange={setDemoteTo}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEMOTE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r] ?? r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button type="submit" size="sm" className="h-8" disabled={pending || !userId.trim()}>
          {pending ? "Saving…" : "Apply"}
        </Button>
      </div>
    </form>
  );
}

export function RolesClient({ roleCounts }: Props) {
  const total = roleCounts.reduce((sum, r) => sum + r.count, 0);

  return (
    <div>
      <PromoteDemoteForm />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {roleCounts.map(({ role, count }) => (
          <div
            key={role}
            className="p-4 border border-neutral-200 rounded-lg bg-white"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                {ROLE_LABELS[role] ?? role}
              </span>
            </div>
            <p className="text-2xl font-semibold text-neutral-900">
              {count.toLocaleString()}
            </p>
            {total > 0 && (
              <p className="text-xs text-neutral-400 mt-1">
                {((count / total) * 100).toFixed(1)}% of users
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
