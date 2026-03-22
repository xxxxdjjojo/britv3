"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStep } from "@/hooks/useOnboardingStep";
import { Globe, Linkedin, Instagram, Facebook } from "lucide-react";

const PLATFORMS = [
  { id: "website", label: "Website", icon: Globe, placeholder: "https://www.youragency.co.uk" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/yourname" },
  { id: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/youragency" },
  { id: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/youragency" },
  { id: "tiktok", label: "TikTok", icon: Globe, placeholder: "https://tiktok.com/@youragency" },
  { id: "rightmove", label: "Rightmove", icon: Globe, placeholder: "https://rightmove.co.uk/..." },
  { id: "zoopla", label: "Zoopla", icon: Globe, placeholder: "https://zoopla.co.uk/..." },
] as const;

export function SocialLinksStep(
  props: Readonly<{
    stepNumber: number;
    onSubmit: () => void;
    onBack: () => void;
    onSkip: () => void;
  }>,
) {
  const { saving, saveStep } = useOnboardingStep(props.stepNumber);
  const [links, setLinks] = useState<Record<string, string>>({});

  function updateLink(platform: string, url: string) {
    setLinks((prev) => ({ ...prev, [platform]: url }));
  }

  const hasAnyLink = Object.values(links).some((v) => v.trim());

  async function handleSubmit() {
    if (!hasAnyLink) return;

    const result = await saveStep(async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete existing and replace
      await supabase.from("social_links").delete().eq("user_id", user.id);

      const rows = Object.entries(links)
        .filter(([, url]) => url.trim())
        .map(([platform, url]) => ({
          user_id: user.id,
          platform,
          url: url.trim(),
        }));

      if (rows.length > 0) {
        const { error: insertError } = await supabase.from("social_links").insert(rows);
        if (insertError) throw new Error(insertError.message);
      }

      return rows;
    });

    if (result) props.onSubmit();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Online Presence
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Add links to your website and social profiles. These appear on your public profile.
        </p>
      </div>

      <div className="space-y-4">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          return (
            <div key={platform.id} className="space-y-1">
              <Label className="flex items-center gap-2 text-xs">
                <Icon className="size-3.5 text-neutral-400" />
                {platform.label}
              </Label>
              <Input
                placeholder={platform.placeholder}
                value={links[platform.id] || ""}
                onChange={(e) => updateLink(platform.id, e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={props.onBack} className="flex-1">Back</Button>
        <Button onClick={handleSubmit} disabled={saving || !hasAnyLink} className="flex-1">
          {saving ? "Saving..." : "Save and Continue"}
        </Button>
      </div>

      <button
        type="button"
        onClick={props.onSkip}
        className="w-full text-center text-sm text-neutral-400 hover:text-neutral-600"
      >
        Skip for now
      </button>
    </div>
  );
}
