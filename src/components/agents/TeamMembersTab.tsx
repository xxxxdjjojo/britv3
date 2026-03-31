/**
 * TeamMembersTab — Server Component
 *
 * Renders a responsive grid of estate agent team member cards.
 * Each card shows avatar (photo or initials fallback), name, role,
 * bio excerpt, and an email contact link.
 */

import Image from "next/image";
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
      <div className="w-20 h-20 rounded-full border-2 border-[#1B4D3E]/20 overflow-hidden mb-4 flex-shrink-0">
        <Image
          src={avatarUrl}
          alt={fullName ?? "Team member"}
          width={80}
          height={80}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div className="w-20 h-20 rounded-full border-2 border-[#1B4D3E]/20 bg-[#1B4D3E] flex items-center justify-center mb-4 flex-shrink-0">
      <span className="text-white text-2xl font-bold">{initials}</span>
    </div>
  );
}

export function TeamMembersTab({ members }: TeamMembersTabProps) {
  if (members.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-[#f4f3f2] dark:bg-[#1a2822] text-center">
        <p className="text-[#6b7280] dark:text-[#9ca3af] text-sm">
          Team information coming soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold tracking-tight text-[#1a1a1a] dark:text-white">
        Our Team
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-[#f4f3f2] dark:bg-[#1a2822] rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center"
          >
            <MemberAvatar
              fullName={member.full_name}
              avatarUrl={member.avatar_url}
            />

            <p className="text-lg font-bold text-[#1a1a1a] dark:text-white">
              {member.full_name ?? "Team Member"}
            </p>

            {member.role && (
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-1">
                {member.role}
              </p>
            )}

            {member.bio && (
              <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-2 line-clamp-3 leading-relaxed">
                {member.bio}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
