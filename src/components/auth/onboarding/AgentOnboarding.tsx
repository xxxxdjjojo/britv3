"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingLayout } from "@/components/auth/OnboardingLayout";
import { createClient } from "@/lib/supabase/client";
import { sanitize } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

const STEPS = ["Your Agency", "Your Profile", "Invite Team"];
const UK_REGIONS = [
  "London", "South East", "East of England", "South West",
  "West Midlands", "East Midlands", "Yorkshire", "North West",
  "North East", "Wales", "Scotland", "Northern Ireland",
];
const SPECIALISMS = [
  "Residential Sales", "Lettings", "Commercial", "New Builds", "Luxury",
];

export function AgentOnboarding(
  props: Readonly<{
    onComplete: () => void;
    onSkip: () => void;
  }>,
) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Agency
  const [agencyName, setAgencyName] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [regNumber, setRegNumber] = useState("");

  // Step 2 — Profile
  const [jobTitle, setJobTitle] = useState("");
  const [coverageRegions, setCoverageRegions] = useState<string[]>([]);
  const [specialisms, setSpecialisms] = useState<string[]>([]);

  // Step 3 — Team
  const [inviteEmail, setInviteEmail] = useState("");
  const [invites, setInvites] = useState<{ email: string; role: "agent" | "admin" }[]>([]);

  function toggleItem<T extends string>(items: T[], item: T, setter: (v: T[]) => void) {
    setter(items.includes(item) ? items.filter((i) => i !== item) : [...items, item]);
  }

  function addInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (email && !invites.find((i) => i.email === email)) {
      setInvites([...invites, { email, role: "agent" }]);
      setInviteEmail("");
    }
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Create agency
        const { data: agency } = await supabase
          .from("agencies")
          .insert({
            name: sanitize(agencyName),
            address: sanitize(agencyAddress),
            registration_number: sanitize(regNumber),
            owner_id: user.id,
          })
          .select("id")
          .single();

        // Create agent profile
        await supabase.from("agent_profiles").upsert(
          {
            user_id: user.id,
            agency_id: agency?.id,
            job_title: sanitize(jobTitle),
            coverage_areas: coverageRegions,
            specialisms,
          },
          { onConflict: "user_id" },
        );

        // Send invites
        if (invites.length > 0) {
          await supabase.from("agency_invitations").insert(
            invites.map((inv) => ({
              agency_id: agency?.id,
              email: inv.email,
              role: inv.role,
              invited_by: user.id,
            })),
          );
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setSaving(false);
    }
    // Agents go to 2FA setup
    router.push("/two-factor-setup");
  }

  const SkipLink = () => (
    <button type="button" onClick={props.onSkip} className="w-full text-center font-body text-sm text-neutral-400 hover:text-neutral-600">
      Skip for now
    </button>
  );

  return (
    <OnboardingLayout steps={STEPS} currentStep={step} title={["Tell us about your agency", "Your profile", "Invite your team"][step]} subtitle="We'll set up your agency workspace.">
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Agency name</Label>
            <Input placeholder="e.g. Mitchell & Clarke Estate Agents" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Office address</Label>
            <Input placeholder="e.g. 10 King Street, Manchester, M2 4WG" value={agencyAddress} onChange={(e) => setAgencyAddress(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Registration number <span className="text-neutral-400 text-xs">(optional)</span></Label>
            <Input placeholder="e.g. Companies House or ARLA number" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} className="h-11" />
          </div>
          <Button onClick={() => setStep(1)} className="w-full" disabled={!agencyName}>Continue</Button>
          <SkipLink />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Job title</Label>
            <Input placeholder="e.g. Senior Sales Negotiator" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Coverage regions</Label>
            <div className="flex flex-wrap gap-1.5">
              {UK_REGIONS.map((region) => (
                <button key={region} type="button" onClick={() => toggleItem(coverageRegions, region, setCoverageRegions)} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition-colors", coverageRegions.includes(region) ? "border-brand-primary bg-brand-primary text-white" : "border-neutral-300 text-neutral-600 hover:border-brand-primary")}>
                  {region}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Specialisms</Label>
            <div className="flex flex-wrap gap-1.5">
              {SPECIALISMS.map((s) => (
                <button key={s} type="button" onClick={() => toggleItem(specialisms, s, setSpecialisms)} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition-colors", specialisms.includes(s) ? "border-brand-primary bg-brand-primary text-white" : "border-neutral-300 text-neutral-600 hover:border-brand-primary")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
            <Button onClick={() => setStep(2)} className="flex-1">Continue</Button>
          </div>
          <SkipLink />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="colleague@agency.co.uk" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addInvite()} className="h-11" />
            <Button type="button" variant="outline" onClick={addInvite} className="gap-1">
              <Plus className="size-4" />
              Add
            </Button>
          </div>
          {invites.length > 0 && (
            <ul className="space-y-2">
              {invites.map((inv) => (
                <li key={inv.email} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
                  <span className="text-sm text-neutral-900">{inv.email}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={inv.role}
                      onChange={(e) => setInvites(invites.map((i) => i.email === inv.email ? { ...i, role: e.target.value as "agent" | "admin" } : i))}
                      className="rounded border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600"
                    >
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={() => setInvites(invites.filter((i) => i.email !== inv.email))} className="text-neutral-400 hover:text-neutral-600">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button onClick={handleComplete} disabled={saving} className="flex-1">
              {saving ? "Setting up…" : "Complete Setup"}
            </Button>
          </div>
          <button type="button" onClick={() => router.push("/two-factor-setup")} className="w-full text-center font-body text-sm text-neutral-400 hover:text-neutral-600">
            Skip team invites
          </button>
        </div>
      )}
    </OnboardingLayout>
  );
}
