"use client";

import { useEffect, useState, useCallback } from "react";
import { Globe, Accessibility, Monitor, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type PrefsState = {
  locale: string;
  date_format: string;
  currency: string;
  timezone: string;
  font_size: string;
  reduced_motion: boolean;
  high_contrast: boolean;
  dark_mode: string;
  screen_reader_hints: boolean;
};

const DEFAULTS: PrefsState = {
  locale: "en-GB",
  date_format: "DD/MM/YYYY",
  currency: "GBP",
  timezone: "Europe/London",
  font_size: "medium",
  reduced_motion: false,
  high_contrast: false,
  dark_mode: "system",
  screen_reader_hints: false,
};

const LOCALE_OPTIONS = [
  { value: "en-GB", label: "English (UK)" },
  // TODO: Re-enable cy-GB (Welsh) and gd-GB (Gaelic) when i18n translations are ready
] as const;

const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
] as const;

const CURRENCY_OPTIONS = [
  { value: "GBP", label: "GBP (£)" },
] as const;

const TIMEZONE_OPTIONS = [
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Dublin", label: "Dublin (IST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Europe/Madrid", label: "Madrid (CET)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
] as const;

const FONT_SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
] as const;

const DARK_MODE_OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

// ---------------------------------------------------------------------------
// Dark mode preview helper
// ---------------------------------------------------------------------------

function applyDarkModePreview(mode: string) {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "light") {
    root.classList.remove("dark");
  } else {
    // "system" — follow OS preference
    root.classList.remove("dark");
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    }
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PreferencesSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="h-4 w-28 animate-pulse rounded bg-neutral-200" />
          <div className="h-8 w-40 animate-pulse rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PreferencesSettingsPage() {
  const [prefs, setPrefs] = useState<PrefsState>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/prefs");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json() as PrefsState;
        setPrefs({ ...DEFAULTS, ...data });
        // Apply persisted dark mode on load
        applyDarkModePreview(data.dark_mode ?? "system");
      } catch {
        // Use defaults on error
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const saveField = useCallback(
    async (key: keyof PrefsState, value: string | boolean) => {
      // Optimistic update
      setPrefs((prev) => ({ ...prev, [key]: value }));

      // Live dark mode preview
      if (key === "dark_mode" && typeof value === "string") {
        applyDarkModePreview(value);
      }

      try {
        const res = await fetch("/api/settings/prefs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [key]: value }),
        });

        if (!res.ok) throw new Error("Save failed");
        toast.success("Saved", { duration: 2000 });
      } catch {
        // Revert on failure
        setPrefs((prev) => ({ ...prev, [key]: prefs[key] }));
        toast.error("Failed to save. Please try again.");
      }
    },
    [prefs],
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="font-heading text-xl font-semibold text-neutral-900 dark:text-white">
          Preferences
        </h2>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Customise your language, region, and accessibility settings.
        </p>
      </div>

      {/* Language & Region */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="size-5 text-brand-primary" />
          <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
            Language &amp; Region
          </h3>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
          {loading ? (
            <div className="p-6">
              <PreferencesSkeleton />
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {/* Locale */}
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <Label className="font-body text-sm font-medium text-neutral-900 dark:text-white">
                    Language
                  </Label>
                  <p className="font-body text-xs text-neutral-500">
                    Display language for the interface.
                  </p>
                </div>
                <Select
                  value={prefs.locale}
                  onValueChange={(v) => void saveField("locale", v ?? "en-GB")}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date format */}
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <Label className="font-body text-sm font-medium text-neutral-900 dark:text-white">
                    Date Format
                  </Label>
                  <p className="font-body text-xs text-neutral-500">
                    How dates are displayed throughout the site.
                  </p>
                </div>
                <Select
                  value={prefs.date_format}
                  onValueChange={(v) => void saveField("date_format", v ?? "DD/MM/YYYY")}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Currency */}
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <Label className="font-body text-sm font-medium text-neutral-900 dark:text-white">
                    Currency
                  </Label>
                  <p className="font-body text-xs text-neutral-500">
                    Default currency for prices and calculations.
                  </p>
                </div>
                <Select
                  value={prefs.currency}
                  onValueChange={(v) => void saveField("currency", v ?? "GBP")}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone */}
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <Label className="font-body text-sm font-medium text-neutral-900 dark:text-white">
                    Timezone
                  </Label>
                  <p className="font-body text-xs text-neutral-500">
                    Used for scheduling and event times.
                  </p>
                </div>
                <Select
                  value={prefs.timezone}
                  onValueChange={(v) => void saveField("timezone", v ?? "Europe/London")}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Accessibility */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Accessibility className="size-5 text-brand-primary" />
          <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
            Accessibility
          </h3>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
          {loading ? (
            <div className="p-6">
              <PreferencesSkeleton />
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {/* Font size */}
              <div className="p-4">
                <Label className="font-body text-sm font-medium text-neutral-900 dark:text-white">
                  Font Size
                </Label>
                <p className="mb-3 font-body text-xs text-neutral-500">
                  Adjust the base text size across the interface.
                </p>
                <RadioGroup
                  value={prefs.font_size}
                  onValueChange={(value) =>
                    void saveField("font_size", value as string)
                  }
                  className="flex gap-4"
                >
                  {FONT_SIZE_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={opt.value}
                        id={`font-size-${opt.value}`}
                      />
                      <Label
                        htmlFor={`font-size-${opt.value}`}
                        className="cursor-pointer font-body text-sm text-neutral-700 dark:text-neutral-300"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Reduced motion */}
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <Label
                    htmlFor="reduced-motion"
                    className="font-body text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    Reduced Motion
                  </Label>
                  <p className="font-body text-xs text-neutral-500">
                    Minimise animations and transitions.
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={prefs.reduced_motion}
                  onCheckedChange={(checked) =>
                    void saveField("reduced_motion", checked)
                  }
                />
              </div>

              {/* High contrast */}
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <Label
                    htmlFor="high-contrast"
                    className="font-body text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    High Contrast
                  </Label>
                  <p className="font-body text-xs text-neutral-500">
                    Increase contrast for better readability.
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={prefs.high_contrast}
                  onCheckedChange={(checked) =>
                    void saveField("high_contrast", checked)
                  }
                />
              </div>

              {/* Dark mode */}
              <div className="p-4">
                <Label className="font-body text-sm font-medium text-neutral-900 dark:text-white">
                  Appearance
                </Label>
                <p className="mb-3 font-body text-xs text-neutral-500">
                  Choose a colour scheme. Changes apply instantly.
                </p>
                <RadioGroup
                  value={prefs.dark_mode}
                  onValueChange={(value) =>
                    void saveField("dark_mode", value as string)
                  }
                  className="flex gap-3"
                >
                  {DARK_MODE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem
                          value={opt.value}
                          id={`dark-mode-${opt.value}`}
                        />
                        <Label
                          htmlFor={`dark-mode-${opt.value}`}
                          className="flex cursor-pointer items-center gap-1.5 font-body text-sm text-neutral-700 dark:text-neutral-300"
                        >
                          <Icon className="size-3.5" />
                          {opt.label}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              {/* Screen reader hints */}
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <Label
                    htmlFor="screen-reader-hints"
                    className="font-body text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    Screen Reader Hints
                  </Label>
                  <p className="font-body text-xs text-neutral-500">
                    Add extra ARIA descriptions for screen reader users.
                  </p>
                </div>
                <Switch
                  id="screen-reader-hints"
                  checked={prefs.screen_reader_hints}
                  onCheckedChange={(checked) =>
                    void saveField("screen_reader_hints", checked)
                  }
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
