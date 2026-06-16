"use client";

import { useState, useTransition } from "react";
import type { TeamMember } from "@/app/(admin)/admin/team/page";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, UserCheck } from "lucide-react";

type Props = Readonly<{ members: TeamMember[]; isSuperAdmin?: boolean }>;

function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/team/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? "Failed to send invite");
        }
        toast.success(`Invite sent to ${email.trim()}`);
        setEmail("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to send invite");
      }
    });
  }

  return (
    <form
      onSubmit={handleInvite}
      className="flex items-center gap-3 mb-6 p-4 border border-border rounded-lg bg-card"
    >
      <Mail className="h-4 w-4 text-neutral-400 shrink-0" />
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="colleague@company.com"
        className="h-8 text-sm max-w-sm"
        required
      />
      <Button
        type="submit"
        size="sm"
        className="h-8"
        disabled={pending || !email.trim()}
      >
        {pending ? "Sending…" : "Send Invite"}
      </Button>
    </form>
  );
}

export function TeamClient({ members, isSuperAdmin = false }: Props) {
  return (
    <div>
      {isSuperAdmin && <InviteForm />}

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Admin
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {members.map((member) => (
              <tr
                key={member.id}
                className="hover:bg-muted transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-brand-primary flex items-center justify-center shrink-0">
                      <UserCheck className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 text-sm">
                        {member.fullName ?? "—"}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {member.email ?? "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={member.isSuspended ? "suspended" : "active"}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500">
                  {member.createdAt
                    ? new Date(member.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
