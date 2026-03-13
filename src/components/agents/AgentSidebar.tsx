/**
 * AgentSidebar — Server Component
 *
 * Sidebar for the estate agent public profile page.
 * Contains a valuation CTA card, office information, map placeholder,
 * and a team preview skeleton (team wired in 17-05).
 */

import { MapPin, Phone, Clock } from "lucide-react";
import Image from "next/image";
import type { AgentPublicProfile, AgentTeamMember } from "@/types/providers";
import { ValuationSheet } from "@/components/agents/ValuationSheet";

type AgentSidebarProps = Readonly<{
  agency: AgentPublicProfile;
  previewMembers?: AgentTeamMember[];
}>;

export default function AgentSidebar({
  agency,
  previewMembers,
}: AgentSidebarProps) {
  const agencyAddress = agency.agency?.address ?? null;
  const phone = agency.phone ?? null;

  return (
    <aside className="space-y-6">
      {/* Valuation CTA card */}
      <div className="bg-[#2563EB] text-white rounded-xl p-6 shadow-xl">
        <h3 className="text-lg font-bold mb-1">Thinking of selling?</h3>
        <p className="text-blue-100 text-sm mb-4">
          Get a free property valuation from our local experts.
        </p>
        <ValuationSheet
          agencyId={agency.agency?.id ?? agency.id}
          agencyName={agency.agency?.name ?? agency.display_name}
        />
      </div>

      {/* Office Information */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Office Information
        </h3>
        <ul className="space-y-3">
          {agencyAddress && (
            <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
              <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
              <span>{agencyAddress}</span>
            </li>
          )}
          {phone && (
            <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{phone}</span>
            </li>
          )}
          <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
            <Clock className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
            <div>
              <p>Mon–Fri: 9:00–18:30</p>
              <p>Sat: 10:00–16:00</p>
            </div>
          </li>
        </ul>
      </div>

      {/* Map placeholder */}
      <div className="h-32 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-sm border border-slate-200 dark:border-slate-700">
        Map view
      </div>

      {/* Team preview */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Meet the Team
        </h3>
        {previewMembers && previewMembers.length > 0 ? (
          <div className="space-y-3">
            {previewMembers.map((member) => {
              const initials = member.full_name
                ? member.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "?";
              return (
                <div key={member.id} className="flex items-center gap-3">
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.full_name ?? "Team member"}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {initials}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {member.full_name ?? "Team Member"}
                    </p>
                    {member.role && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {member.role}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
