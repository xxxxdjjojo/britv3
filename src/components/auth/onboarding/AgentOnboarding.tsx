"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingLayout } from "@/components/auth/OnboardingLayout";
import { createClient } from "@/lib/supabase/client";
import { sanitize } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { Plus, X, Upload, Mail, Users, Building2, Link2 } from "lucide-react";

const STEPS = ["Your Agency", "Your Profile", "Invite Team"];

const UK_REGIONS = [
  "London",
  "South East",
  "East of England",
  "South West",
  "West Midlands",
  "East Midlands",
  "Yorkshire",
  "North West",
  "North East",
  "Wales",
  "Scotland",
  "Northern Ireland",
];

const SPECIALISMS = [
  "Residential Sales",
  "Lettings",
  "Commercial",
  "New Builds",
  "Luxury",
];

const CRM_PLATFORMS = [
  { label: "Reapit", value: "reapit" },
  { label: "Alto", value: "alto" },
  { label: "Jupix", value: "jupix" },
  { label: "Expert Agent", value: "expert_agent" },
  { label: "Manual entry", value: "manual" },
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
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<string | null>(null);

  // Step 1 — Agency
  const [agencyName, setAgencyName] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [crmPlatform, setCrmPlatform] = useState("");

  // Step 2 — Profile
  const [jobTitle, setJobTitle] = useState("");
  const [coverageRegions, setCoverageRegions] = useState<string[]>([]);
  const [specialisms, setSpecialisms] = useState<string[]>([]);

  // Step 3 — Team
  const [inviteEmail, setInviteEmail] = useState("");
  const [invites, setInvites] = useState<
    { email: string; role: "agent" | "admin" }[]
  >([]);

  function toggleItem<T extends string>(
    items: T[],
    item: T,
    setter: (v: T[]) => void,
  ) {
    setter(
      items.includes(item)
        ? items.filter((i) => i !== item)
        : [...items, item],
    );
  }

  function addInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (email && !invites.find((i) => i.email === email)) {
      setInvites([...invites, { email, role: "agent" }]);
      setInviteEmail("");
    }
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file.name);
    }
  }

  function getInitials(email: string) {
    return email.slice(0, 2).toUpperCase();
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  const SkipLink = ({
    label = "Skip for now",
    onClick,
  }: {
    label?: string;
    onClick?: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick ?? props.onSkip}
      aria-label={label}
      className="w-full text-center font-sans text-sm text-neutral-400 transition-colors hover:text-neutral-600"
    >
      {label}
    </button>
  );

  return (
    <OnboardingLayout
      steps={STEPS}
      currentStep={step}
      title={
        [
          "Tell us about your agency",
          "Your professional profile",
          "Invite your team",
        ][step]
      }
      subtitle={
        [
          "We'll set up your agency workspace.",
          "Help clients discover the right specialist.",
          "Collaborate with your colleagues from day one.",
        ][step]
      }
    >
      {/* ─── Step 1: Agency Details ──────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          {/* Logo upload zone */}
          <div className="space-y-2">
            <Label className="font-sans text-sm font-medium text-neutral-700">
              Agency logo{" "}
              <span className="text-xs font-normal text-neutral-400">
                (optional)
              </span>
            </Label>
            <input
              ref={logoInputRef}
              type="file"
              accept=".svg,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleLogoSelect}
              aria-hidden="true"
            />
            <button
              type="button"
              aria-label="Upload agency logo"
              onClick={() => logoInputRef.current?.click()}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition-all",
                logoFile
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-neutral-200 bg-neutral-50 hover:border-brand-primary hover:bg-brand-primary/5",
              )}
            >
              {logoFile ? (
                <>
                  <Building2
                    className="size-6 text-brand-primary"
                    aria-hidden="true"
                  />
                  <span className="font-sans text-sm font-medium text-brand-primary">
                    {logoFile}
                  </span>
                  <span className="font-sans text-xs text-neutral-400">
                    Click to change
                  </span>
                </>
              ) : (
                <>
                  <Upload
                    className="size-6 text-neutral-400"
                    aria-hidden="true"
                  />
                  <span className="font-sans text-sm font-medium text-neutral-600">
                    Upload logo
                  </span>
                  <span className="font-sans text-xs text-neutral-400">
                    SVG or PNG, minimum 800px wide
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="agency-name"
              className="font-sans text-sm font-medium text-neutral-700"
            >
              Agency name
            </Label>
            <Input
              id="agency-name"
              placeholder="e.g. Mitchell & Clarke Estate Agents"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              aria-label="Agency name"
              className="h-11 rounded-xl border-2 border-neutral-200 text-sm focus:border-brand-primary"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="office-address"
              className="font-sans text-sm font-medium text-neutral-700"
            >
              Office address
            </Label>
            <Input
              id="office-address"
              placeholder="e.g. 10 King Street, Manchester, M2 4WG"
              value={agencyAddress}
              onChange={(e) => setAgencyAddress(e.target.value)}
              aria-label="Office address"
              className="h-11 rounded-xl border-2 border-neutral-200 text-sm focus:border-brand-primary"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="reg-number"
              className="font-sans text-sm font-medium text-neutral-700"
            >
              Registration number{" "}
              <span className="text-xs font-normal text-neutral-400">
                (optional)
              </span>
            </Label>
            <Input
              id="reg-number"
              placeholder="e.g. Companies House or ARLA number"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              aria-label="Registration number"
              className="h-11 rounded-xl border-2 border-neutral-200 text-sm focus:border-brand-primary"
            />
          </div>

          {/* CRM platform */}
          <div className="space-y-2">
            <Label className="font-sans text-sm font-medium text-neutral-700">
              CRM / listing software{" "}
              <span className="text-xs font-normal text-neutral-400">
                (optional)
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {CRM_PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={crmPlatform === p.value}
                  aria-label={`Select ${p.label} as CRM platform`}
                  onClick={() =>
                    setCrmPlatform(crmPlatform === p.value ? "" : p.value)
                  }
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 font-sans text-sm font-medium transition-all",
                    crmPlatform === p.value
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-primary hover:text-brand-primary",
                  )}
                >
                  {p.value !== "manual" && (
                    <Link2
                      className="size-3.5"
                      aria-hidden="true"
                    />
                  )}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => setStep(1)}
            disabled={!agencyName}
            aria-label="Continue to profile step"
            className="w-full h-11 rounded-xl bg-brand-primary font-semibold text-white hover:bg-brand-primary-light disabled:opacity-60"
          >
            Continue
          </Button>
          <SkipLink />
        </div>
      )}

      {/* ─── Step 2: Team Profile ────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="job-title"
              className="font-sans text-sm font-medium text-neutral-700"
            >
              Job title
            </Label>
            <Input
              id="job-title"
              placeholder="e.g. Senior Sales Negotiator"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              aria-label="Job title"
              className="h-11 rounded-xl border-2 border-neutral-200 text-sm focus:border-brand-primary"
            />
          </div>

          <div className="space-y-3">
            <Label className="font-sans text-sm font-medium text-neutral-700">
              Coverage regions
            </Label>
            <div className="flex flex-wrap gap-2">
              {UK_REGIONS.map((region) => (
                <button
                  key={region}
                  type="button"
                  aria-pressed={coverageRegions.includes(region)}
                  aria-label={`Toggle coverage region: ${region}`}
                  onClick={() =>
                    toggleItem(coverageRegions, region, setCoverageRegions)
                  }
                  className={cn(
                    "rounded-full border-2 px-3 py-1 font-sans text-xs font-medium transition-all",
                    coverageRegions.includes(region)
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-primary hover:text-brand-primary",
                  )}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-sans text-sm font-medium text-neutral-700">
              Specialisms
            </Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALISMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={specialisms.includes(s)}
                  aria-label={`Toggle specialism: ${s}`}
                  onClick={() => toggleItem(specialisms, s, setSpecialisms)}
                  className={cn(
                    "rounded-full border-2 px-3 py-1 font-sans text-xs font-medium transition-all",
                    specialisms.includes(s)
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-primary hover:text-brand-primary",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => setStep(0)}
              aria-label="Go back to agency details"
              className="flex-1 h-11 rounded-xl border-2 border-neutral-200 font-semibold text-neutral-700 hover:border-neutral-300"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep(2)}
              aria-label="Continue to team invitations"
              className="flex-1 h-11 rounded-xl bg-brand-primary font-semibold text-white hover:bg-brand-primary-light"
            >
              Continue
            </Button>
          </div>
          <SkipLink />
        </div>
      )}

      {/* ─── Step 3: Invite Team ─────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Seat counter hint */}
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Users
                className="size-4 text-neutral-500"
                aria-hidden="true"
              />
              <span className="font-sans text-sm text-neutral-600">
                Team members
              </span>
            </div>
            <span className="font-sans text-sm font-semibold text-neutral-900">
              {invites.length + 1} / 10 seats
            </span>
          </div>

          {/* Invite input */}
          <div className="space-y-2">
            <Label
              htmlFor="invite-email"
              className="font-sans text-sm font-medium text-neutral-700"
            >
              Invite a colleague
            </Label>
            <div className="flex gap-2">
              <Input
                id="invite-email"
                placeholder="colleague@agency.co.uk"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addInvite()}
                aria-label="Colleague email address"
                className="h-11 flex-1 rounded-xl border-2 border-neutral-200 text-sm focus:border-brand-primary"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addInvite}
                aria-label="Add invite"
                className="h-11 gap-1.5 rounded-xl border-2 border-neutral-200 font-semibold hover:border-brand-primary hover:text-brand-primary"
              >
                <Plus className="size-4" aria-hidden="true" />
                Add
              </Button>
            </div>
          </div>

          {/* Invite list */}
          {invites.length > 0 && (
            <ul className="space-y-2" aria-label="Pending invitations">
              {invites.map((inv) => (
                <li
                  key={inv.email}
                  className="flex items-center justify-between rounded-xl border-2 border-neutral-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar initials */}
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 font-sans text-xs font-bold text-brand-primary">
                      {getInitials(inv.email)}
                    </div>
                    <div>
                      <p className="font-sans text-sm font-medium text-neutral-900">
                        {inv.email}
                      </p>
                      <span className="font-sans text-xs text-neutral-400">
                        Invitation pending
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={inv.role}
                      aria-label={`Role for ${inv.email}`}
                      onChange={(e) =>
                        setInvites(
                          invites.map((i) =>
                            i.email === inv.email
                              ? {
                                  ...i,
                                  role: e.target.value as "agent" | "admin",
                                }
                              : i,
                          ),
                        )
                      }
                      className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 font-sans text-xs font-medium text-neutral-700 outline-none focus:border-brand-primary"
                    >
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="button"
                      aria-label={`Remove invitation for ${inv.email}`}
                      onClick={() =>
                        setInvites(invites.filter((i) => i.email !== inv.email))
                      }
                      className="flex size-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Empty state hint */}
          {invites.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 py-6 text-center">
              <Mail
                className="size-7 text-neutral-300"
                aria-hidden="true"
              />
              <p className="font-sans text-sm text-neutral-400">
                No invitations added yet
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              aria-label="Go back to profile step"
              className="flex-1 h-11 rounded-xl border-2 border-neutral-200 font-semibold text-neutral-700 hover:border-neutral-300"
            >
              Back
            </Button>
            <Button
              onClick={handleComplete}
              disabled={saving}
              aria-label={
                saving ? "Setting up your agency" : "Complete agency setup"
              }
              className="flex-1 h-11 rounded-xl bg-brand-primary font-semibold text-white hover:bg-brand-primary-light disabled:opacity-60"
            >
              {saving ? "Setting up…" : "Complete Setup"}
            </Button>
          </div>
          <button
            type="button"
            aria-label="Skip team invitations and proceed to 2FA setup"
            onClick={() => router.push("/two-factor-setup")}
            className="w-full text-center font-sans text-sm text-neutral-400 transition-colors hover:text-neutral-600"
          >
            Skip team invites
          </button>
        </div>
      )}
    </OnboardingLayout>
  );
}
