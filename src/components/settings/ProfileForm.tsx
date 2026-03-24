"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReauthDialog } from "@/components/settings/ReauthDialog";

const MAX_BIO_LENGTH = 300;

type ProfileFormProps = Readonly<{
  initialData: {
    first_name: string;
    last_name: string;
    phone: string | null;
    postcode: string | null;
    bio: string | null;
    email: string;
  };
  activeRole?: string;
  roleData?: Record<string, unknown>;
}>;

function toCommaSeparated(val: unknown): string {
  if (Array.isArray(val)) return (val as string[]).join(", ");
  return "";
}

export function ProfileForm({ initialData, activeRole, roleData }: ProfileFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialData.first_name);
  const [lastName, setLastName] = useState(initialData.last_name);
  const [phone, setPhone] = useState(initialData.phone ?? "");
  const [postcode, setPostcode] = useState(initialData.postcode ?? "");
  const [bio, setBio] = useState(initialData.bio ?? "");
  const [saving, setSaving] = useState(false);

  // Agent role fields
  const [agencyName, setAgencyName] = useState(
    (roleData?.agency_name as string) ?? ""
  );
  const [specializations, setSpecializations] = useState(
    toCommaSeparated(roleData?.specializations)
  );
  const [coverageAreas, setCoverageAreas] = useState(
    toCommaSeparated(roleData?.coverage_areas)
  );

  // Provider role fields
  const [businessName, setBusinessName] = useState(
    (roleData?.business_name as string) ?? ""
  );
  const [tradingName, setTradingName] = useState(
    (roleData?.trading_name as string) ?? ""
  );
  const [servicePostcodes, setServicePostcodes] = useState(
    toCommaSeparated(roleData?.service_postcodes)
  );

  // Email change state
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [sendingEmailChange, setSendingEmailChange] = useState(false);
  const [emailReauthOpen, setEmailReauthOpen] = useState(false);

  // Initial role values for dirty checking
  const initAgencyName = (roleData?.agency_name as string) ?? "";
  const initSpecializations = toCommaSeparated(roleData?.specializations);
  const initCoverageAreas = toCommaSeparated(roleData?.coverage_areas);
  const initBusinessName = (roleData?.business_name as string) ?? "";
  const initTradingName = (roleData?.trading_name as string) ?? "";
  const initServicePostcodes = toCommaSeparated(roleData?.service_postcodes);

  function handleCancel() {
    setFirstName(initialData.first_name);
    setLastName(initialData.last_name);
    setPhone(initialData.phone ?? "");
    setPostcode(initialData.postcode ?? "");
    setBio(initialData.bio ?? "");
    // Reset agent fields
    setAgencyName(initAgencyName);
    setSpecializations(initSpecializations);
    setCoverageAreas(initCoverageAreas);
    // Reset provider fields
    setBusinessName(initBusinessName);
    setTradingName(initTradingName);
    setServicePostcodes(initServicePostcodes);
  }

  const isBaseDirty =
    firstName !== initialData.first_name ||
    lastName !== initialData.last_name ||
    phone !== (initialData.phone ?? "") ||
    postcode !== (initialData.postcode ?? "") ||
    bio !== (initialData.bio ?? "");

  const isRoleDirty =
    (activeRole === "agent" &&
      (agencyName !== initAgencyName ||
        specializations !== initSpecializations ||
        coverageAreas !== initCoverageAreas)) ||
    (activeRole === "service_provider" &&
      (businessName !== initBusinessName ||
        tradingName !== initTradingName ||
        servicePostcodes !== initServicePostcodes));

  const isDirty = isBaseDirty || isRoleDirty;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          postcode: postcode.trim() || null,
          bio: bio.trim() || null,
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorMsg =
          data !== null &&
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to save profile";
        toast.error(errorMsg);
        return;
      }

      // Save role-specific data if dirty
      if (isRoleDirty && (activeRole === "agent" || activeRole === "service_provider")) {
        const rolePayload =
          activeRole === "agent"
            ? {
                role: "agent" as const,
                data: {
                  agency_name: agencyName.trim(),
                  specializations: specializations
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  coverage_areas: coverageAreas
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
              }
            : {
                role: "service_provider" as const,
                data: {
                  business_name: businessName.trim(),
                  trading_name: tradingName.trim() || null,
                  service_postcodes: servicePostcodes
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
              };

        const roleRes = await fetch("/api/settings/profile/role-data", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rolePayload),
        });

        if (!roleRes.ok) {
          const roleErr: unknown = await roleRes.json();
          const errMsg =
            roleErr !== null &&
            typeof roleErr === "object" &&
            "error" in roleErr &&
            typeof (roleErr as { error: unknown }).error === "string"
              ? (roleErr as { error: string }).error
              : "Failed to save role-specific details";
          toast.error(errMsg);
          return;
        }
      }

      toast.success("Profile saved");
      router.refresh();
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function handleEmailChange() {
    if (!newEmail.trim()) return;
    setEmailReauthOpen(true);
  }

  async function handleEmailReauthSuccess(token: string) {
    setSendingEmailChange(true);
    try {
      const res = await fetch("/api/settings/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reauth_token: token, email: newEmail.trim() }),
      });

      const data: unknown = await res.json();

      if (res.ok && typeof data === "object" && data !== null && "message" in data) {
        toast.success((data as { message: string }).message);
      } else {
        toast.error("Failed to update email");
      }

      setChangingEmail(false);
      setNewEmail("");
    } catch {
      toast.error("Failed to update email");
    } finally {
      setSendingEmailChange(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Name row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="first-name">First Name</Label>
          <Input
            id="first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last-name">Last Name</Label>
          <Input
            id="last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            required
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={initialData.email}
          readOnly
          className="cursor-default opacity-70"
        />
        {!changingEmail ? (
          <button
            type="button"
            onClick={() => setChangingEmail(true)}
            className="font-body text-xs text-brand-primary hover:underline"
          >
            Change email address
          </button>
        ) : (
          <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <Label htmlFor="new-email" className="text-xs">
              New email address
            </Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => handleEmailChange()}
                disabled={sendingEmailChange || !newEmail.trim()}
              >
                {sendingEmailChange && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                Send confirmation
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setChangingEmail(false);
                  setNewEmail("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">
          Phone{" "}
          <span className="font-normal text-neutral-400">(optional)</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+44 7xxx xxxxxx"
        />
      </div>

      {/* Postcode */}
      <div className="space-y-1.5">
        <Label htmlFor="postcode">
          Postcode{" "}
          <span className="font-normal text-neutral-400">(optional)</span>
        </Label>
        <Input
          id="postcode"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder="e.g. SW1A 1AA"
        />
      </div>

      {/* Bio with character counter */}
      <div className="space-y-1.5">
        <Label htmlFor="bio">
          Short Bio{" "}
          <span className="font-normal text-neutral-400">(optional)</span>
        </Label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={MAX_BIO_LENGTH}
          rows={3}
          placeholder="Tell us a bit about yourself"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 font-body text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p
          className={
            bio.length >= MAX_BIO_LENGTH
              ? "font-body text-xs text-error"
              : "font-body text-xs text-neutral-400"
          }
        >
          {bio.length}/{MAX_BIO_LENGTH}
        </p>
      </div>

      {/* Agent role fields */}
      {activeRole === "agent" && (
        <fieldset className="space-y-4 border-t border-neutral-100 pt-4">
          <legend className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
            Agency Details
          </legend>
          <div className="space-y-1.5">
            <Label htmlFor="agency-name">Agency Name</Label>
            <Input
              id="agency-name"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="e.g. Foxtons"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="specializations">Specialisations</Label>
            <Input
              id="specializations"
              value={specializations}
              onChange={(e) => setSpecializations(e.target.value)}
              placeholder="e.g. Residential Sales, Lettings"
            />
            <p className="font-body text-xs text-neutral-400">Comma-separated</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coverage-areas">Coverage Areas</Label>
            <Input
              id="coverage-areas"
              value={coverageAreas}
              onChange={(e) => setCoverageAreas(e.target.value)}
              placeholder="e.g. Camden, Islington, Hackney"
            />
            <p className="font-body text-xs text-neutral-400">Comma-separated</p>
          </div>
        </fieldset>
      )}

      {/* Provider role fields */}
      {activeRole === "service_provider" && (
        <fieldset className="space-y-4 border-t border-neutral-100 pt-4">
          <legend className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
            Business Details
          </legend>
          <div className="space-y-1.5">
            <Label htmlFor="business-name">Business Name</Label>
            <Input
              id="business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Smith Plumbing Ltd"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trading-name">
              Trading Name{" "}
              <span className="font-normal text-neutral-400">(optional)</span>
            </Label>
            <Input
              id="trading-name"
              value={tradingName}
              onChange={(e) => setTradingName(e.target.value)}
              placeholder="e.g. Smith&apos;s"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="service-postcodes">
              Service Area Postcodes{" "}
              <span className="font-normal text-neutral-400">(optional)</span>
            </Label>
            <Input
              id="service-postcodes"
              value={servicePostcodes}
              onChange={(e) => setServicePostcodes(e.target.value)}
              placeholder="e.g. SW1, EC1, N1"
            />
            <p className="font-body text-xs text-neutral-400">
              Comma-separated postcode prefixes
            </p>
          </div>
        </fieldset>
      )}

      {/* Save / Cancel bar */}
      <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={saving || !isDirty}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !isDirty}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
      <ReauthDialog
        open={emailReauthOpen}
        onOpenChange={setEmailReauthOpen}
        onSuccess={handleEmailReauthSuccess}
        title="Confirm email change"
        description="Enter your password to change your email address."
      />
    </form>
  );
}
