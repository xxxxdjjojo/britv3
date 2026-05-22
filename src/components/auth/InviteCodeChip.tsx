// src/components/auth/InviteCodeChip.tsx
//
// Memo Pivot v2 — chip + validation message for the signup-page invite flow.

import type { InviteAudience } from "@/lib/invite-codes";

interface Props {
  readonly status: {
    code: string;
    valid: boolean;
    audience?: InviteAudience;
    message?: string;
  };
}

export function InviteCodeChip({ status }: Props) {
  if (status.valid) {
    return (
      <div
        role="status"
        data-invite-audience={status.audience}
        className="flex items-center justify-between rounded-md border border-[#1B4D3E]/30 bg-[#1B4D3E]/5 px-3 py-2"
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-[#1B4D3E]">
            Invite code
          </p>
          <p className="font-mono text-sm text-neutral-900">{status.code}</p>
        </div>
        {status.audience && (
          <span className="rounded-full bg-[#1B4D3E] px-3 py-1 text-xs font-semibold capitalize text-white">
            {status.audience}
          </span>
        )}
      </div>
    );
  }
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
    >
      <strong>Invite code:</strong> {status.code} —{" "}
      {status.message ?? "not recognised."}
    </div>
  );
}
