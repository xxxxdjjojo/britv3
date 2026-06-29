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
    <aside className="space-y-6 lg:sticky lg:top-24">
      {/* Free Valuation CTA card */}
      <div className="bg-brand-primary text-white rounded-2xl p-8 shadow-xl">
        <h3 className="text-2xl font-bold mb-2 text-white">Free Valuation</h3>
        <p className="text-white/80 text-sm mb-6 leading-relaxed">
          Thinking of selling or letting? Get an expert valuation from our local
          experts within 24 hours.
        </p>
        <ValuationSheet
          agencyId={agency.agency?.id ?? agency.id}
          agencyName={agency.agency?.name ?? agency.display_name}
        />
      </div>

      {/* Office Information */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Office Location
        </h3>
        <ul className="space-y-3">
          {agencyAddress && (
            <li className="flex items-start gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
              <span className="leading-relaxed">{agencyAddress}</span>
            </li>
          )}
          {phone && (
            <li className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{phone}</span>
            </li>
          )}
        </ul>
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 text-slate-600 dark:text-slate-400">
          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="flex items-center gap-8">
            <div>
              <p className="text-xs text-slate-500">Mon - Fri</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                9:00 - 18:30
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Sat</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                10:00 - 16:00
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="h-32 rounded-2xl bg-muted dark:bg-slate-800 flex items-center justify-center text-slate-400 text-sm border border-slate-200 dark:border-slate-700">
        Map view
      </div>

      {/* Team preview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
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
                    <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
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
                <div className="w-10 h-10 rounded-full bg-muted dark:bg-slate-800 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted dark:bg-slate-800 rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-muted dark:bg-slate-800 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
