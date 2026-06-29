/**
 * TeamMembersTab — Server Component
 *
 * Renders a responsive grid of estate agent team member cards.
 * Each card shows avatar (photo or initials fallback), name, role,
 * bio excerpt, and an email contact link.
 */

import Image from "next/image";
import { Mail } from "lucide-react";
import type { AgentTeamMember } from "@/types/providers";

type TeamMembersTabProps = Readonly<{
  members: AgentTeamMember[];
}>;

function MemberAvatar({
  fullName,
  avatarUrl,
}: Readonly<{ fullName: string | null; avatarUrl: string | null }>) {
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (avatarUrl) {
    return (
      <div className="w-full aspect-square rounded-xl overflow-hidden mb-3">
        <Image
          src={avatarUrl}
          alt={fullName ?? "Team member"}
          width={240}
          height={240}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div className="w-full aspect-square rounded-xl bg-brand-primary flex items-center justify-center mb-3">
      <span className="text-white text-3xl font-bold">{initials}</span>
    </div>
  );
}

export function TeamMembersTab({ members }: TeamMembersTabProps) {
  if (members.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Team information coming soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        Our Experts
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {members.map((member) => (
          <div key={member.id} className="group text-center">
            <MemberAvatar
              fullName={member.full_name}
              avatarUrl={member.avatar_url}
            />

            <p className="font-bold text-sm text-slate-900 dark:text-white">
              {member.full_name ?? "Team Member"}
            </p>

            {member.role && (
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                {member.role}
              </p>
            )}

            {member.bio && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {member.bio}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
