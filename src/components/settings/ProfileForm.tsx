"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

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
}>;

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [firstName, setFirstName] = useState(initialData.first_name);
  const [lastName, setLastName] = useState(initialData.last_name);
  const [phone, setPhone] = useState(initialData.phone ?? "");
  const [postcode, setPostcode] = useState(initialData.postcode ?? "");
  const [bio, setBio] = useState(initialData.bio ?? "");
  const [saving, setSaving] = useState(false);

  // Email change state
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [sendingEmailChange, setSendingEmailChange] = useState(false);

  function handleCancel() {
    setFirstName(initialData.first_name);
    setLastName(initialData.last_name);
    setPhone(initialData.phone ?? "");
    setPostcode(initialData.postcode ?? "");
    setBio(initialData.bio ?? "");
  }

  const isDirty =
    firstName !== initialData.first_name ||
    lastName !== initialData.last_name ||
    phone !== (initialData.phone ?? "") ||
    postcode !== (initialData.postcode ?? "") ||
    bio !== (initialData.bio ?? "");

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

      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setSendingEmailChange(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) {
        toast.error(error.message ?? "Failed to update email");
        return;
      }
      toast.success("Check your inbox — a confirmation link has been sent");
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
                onClick={handleEmailChange}
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
    </form>
  );
}
