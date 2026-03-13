"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AgentAgencyProfile } from "@/types/agent";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Upload,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Building,
} from "lucide-react";

export function AgencyBrandingForm(
  props: Readonly<{ profile: AgentAgencyProfile | null }>,
) {
  const { profile } = props;
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [primaryColour, setPrimaryColour] = useState(
    profile?.brand_primary_colour ?? "#1e40af",
  );
  const [secondaryColour, setSecondaryColour] = useState(
    profile?.brand_secondary_colour ?? "#f59e0b",
  );
  const [socialFacebook, setSocialFacebook] = useState(
    profile?.social_facebook ?? "",
  );
  const [socialTwitter, setSocialTwitter] = useState(
    profile?.social_twitter ?? "",
  );
  const [socialInstagram, setSocialInstagram] = useState(
    profile?.social_instagram ?? "",
  );
  const [socialLinkedin, setSocialLinkedin] = useState(
    profile?.social_linkedin ?? "",
  );
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("agent-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from("agent-logos")
        .getPublicUrl(fileName);

      setLogoUrl(urlData.publicUrl);
      toast.success("Logo uploaded successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload logo",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        logo_url: logoUrl || undefined,
        brand_primary_colour: primaryColour,
        brand_secondary_colour: secondaryColour,
        social_facebook: socialFacebook || undefined,
        social_twitter: socialTwitter || undefined,
        social_instagram: socialInstagram || undefined,
        social_linkedin: socialLinkedin || undefined,
        website_url: websiteUrl || undefined,
      };

      const res = await fetch("/api/agent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save branding");
      }

      toast.success("Branding saved successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save branding",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main form */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        {/* Logo upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agency Logo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Agency logo"
                    className="size-full object-cover"
                  />
                ) : (
                  <Building className="size-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 size-4" />
                  )}
                  {uploading ? "Uploading..." : "Upload Logo"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG or SVG. Max 2MB.
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </CardContent>
        </Card>

        {/* Brand colours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Brand Colours</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="primary_colour">Primary Colour</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="primary_colour"
                    type="color"
                    value={primaryColour}
                    onChange={(e) => setPrimaryColour(e.target.value)}
                    className="size-10 cursor-pointer rounded border-0 p-0"
                  />
                  <Input
                    value={primaryColour}
                    onChange={(e) => setPrimaryColour(e.target.value)}
                    className="max-w-32"
                    placeholder="#1e40af"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="secondary_colour">Secondary Colour</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="secondary_colour"
                    type="color"
                    value={secondaryColour}
                    onChange={(e) => setSecondaryColour(e.target.value)}
                    className="size-10 cursor-pointer rounded border-0 p-0"
                  />
                  <Input
                    value={secondaryColour}
                    onChange={(e) => setSecondaryColour(e.target.value)}
                    className="max-w-32"
                    placeholder="#f59e0b"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Social Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="website_url">
                <Globe className="mr-1.5 inline-block size-4" />
                Website
              </Label>
              <Input
                id="website_url"
                type="url"
                placeholder="https://www.youragency.co.uk"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="social_facebook">
                  <Facebook className="mr-1.5 inline-block size-4" />
                  Facebook
                </Label>
                <Input
                  id="social_facebook"
                  type="url"
                  placeholder="https://facebook.com/youragency"
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="social_twitter">
                  <Twitter className="mr-1.5 inline-block size-4" />
                  Twitter / X
                </Label>
                <Input
                  id="social_twitter"
                  type="url"
                  placeholder="https://x.com/youragency"
                  value={socialTwitter}
                  onChange={(e) => setSocialTwitter(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="social_instagram">
                  <Instagram className="mr-1.5 inline-block size-4" />
                  Instagram
                </Label>
                <Input
                  id="social_instagram"
                  type="url"
                  placeholder="https://instagram.com/youragency"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="social_linkedin">
                  <Linkedin className="mr-1.5 inline-block size-4" />
                  LinkedIn
                </Label>
                <Input
                  id="social_linkedin"
                  type="url"
                  placeholder="https://linkedin.com/company/youragency"
                  value={socialLinkedin}
                  onChange={(e) => setSocialLinkedin(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            {saving ? "Saving..." : "Save Branding"}
          </Button>
        </div>
      </div>

      {/* Live preview */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="flex flex-col items-center gap-4 rounded-xl border p-6"
              style={{ borderColor: primaryColour }}
            >
              {/* Logo preview */}
              <div
                className="flex size-16 items-center justify-center overflow-hidden rounded-xl"
                style={{ backgroundColor: `${primaryColour}15` }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <Building
                    className="size-8"
                    style={{ color: primaryColour }}
                  />
                )}
              </div>

              {/* Agency name */}
              <p
                className="text-lg font-bold"
                style={{ color: primaryColour }}
              >
                {profile?.agency_name ?? "Your Agency"}
              </p>

              {/* Colour swatches */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="size-8 rounded-full"
                    style={{ backgroundColor: primaryColour }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Primary
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="size-8 rounded-full"
                    style={{ backgroundColor: secondaryColour }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Secondary
                  </span>
                </div>
              </div>

              {/* Sample button */}
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: primaryColour }}
              >
                Sample Button
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
