"use client";

import { useEffect, useState, useCallback } from "react";
import { Globe, Accessibility, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---------- Types ---------- */

type LanguagePrefs = {
  locale: string;
  date_format: string;
  currency: string;
  timezone: string;
};

type AccessibilityPrefs = {
  font_size: string;
  reduced_motion: boolean;
  high_contrast: boolean;
  dark_mode: string;
  screen_reader_hints: boolean;
};

type Prefs = {
  language: LanguagePrefs;
  accessibility: AccessibilityPrefs;
};

/* ---------- Option definitions ---------- */

const LOCALE_OPTIONS = [
  { value: "en-GB", label: "English (UK)" },
  { value: "en-US", label: "English (US)" },
  { value: "cy", label: "Welsh (Cymraeg)" },
  { value: "gd", label: "Scottish Gaelic (Gaidhlig)" },
  { value: "ga", label: "Irish (Gaeilge)" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const CURRENCY_OPTIONS = [
  { value: "GBP", label: "GBP (\u00a3)" },
  { value: "EUR", label: "EUR (\u20ac)" },
  { value: "USD", label: "USD ($)" },
];

const TIMEZONE_OPTIONS = [
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Dublin", label: "Europe/Dublin (IST)" },
  { value: "Europe/Edinburgh", label: "Europe/Edinburgh (GMT/BST)" },
];

const FONT_SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "x-large", label: "X-Large" },
];

const DARK_MODE_OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

/* ---------- Defaults ---------- */

const DEFAULT_PREFS: Prefs = {
  language: {
    locale: "en-GB",
    date_format: "DD/MM/YYYY",
    currency: "GBP",
    timezone: "Europe/London",
  },
  accessibility: {
    font_size: "medium",
    reduced_motion: false,
    high_contrast: false,
    dark_mode: "system",
    screen_reader_hints: true,
  },
};

/* ---------- Skeleton ---------- */

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="h-4 w-28 animate-pulse rounded bg-neutral-200" />
      <div className="h-8 w-40 animate-pulse rounded bg-neutral-100" />
    </div>
  );
}

/* ---------- Page ---------- */

export default function PreferencesSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch("/api/settings/prefs");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setPrefs({
          language: { ...DEFAULT_PREFS.language, ...data.language },
          accessibility: { ...DEFAULT_PREFS.accessibility, ...data.accessibility },
        });
        // Apply dark mode on load
        applyDarkMode(data.accessibility?.dark_mode ?? "system");
      } catch {
        // Fall back to defaults
      } finally {
        setLoading(false);
      }
    }
    void loadPrefs();
  }, [applyDarkMode]);

  const applyDarkMode = useCallback((mode: string) => {
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (mode === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  async function saveLanguageField(key: keyof LanguagePrefs, value: string) {
    const prev = prefs.language[key];

    // Optimistic update
    setPrefs((p) => ({
      ...p,
      language: { ...p.language, [key]: value },
    }));

    try {
      const res = await fetch("/api/settings/prefs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: { [key]: value } }),
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success("Saved", { duration: 2000 });
    } catch {
      // Revert
      setPrefs((p) => ({
        ...p,
        language: { ...p.language, [key]: prev },
      }));
      toast.error("Failed to save. Please try again.");
    }
  }

  async function saveAccessibilityField(
    key: keyof AccessibilityPrefs,
    value: string | boolean,
  ) {
    const prev = prefs.accessibility[key];

    // Optimistic update
    setPrefs((p) => ({
      ...p,
      accessibility: { ...p.accessibility, [key]: value },
    }));

    // Live preview for dark mode
    if (key === "dark_mode" && typeof value === "string") {
      applyDarkMode(value);
    }

    try {
      const res = await fetch("/api/settings/prefs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessibility: { [key]: value } }),
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success("Saved", { duration: 2000 });
    } catch {
      // Revert
      setPrefs((p) => ({
        ...p,
        accessibility: { ...p.accessibility, [key]: prev },
      }));
      // Revert dark mode preview
      if (key === "dark_mode" && typeof prev === "string") {
        applyDarkMode(prev);
      }
      toast.error("Failed to save. Please try again.");
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="font-heading text-xl font-semibold text-neutral-900 dark:text-white">
          Preferences
        </h2>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Customise language, region, and accessibility settings.
        </p>
      </div>

      {/* Language & Region */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-neutral-400" aria-hidden="true" />
          <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
            Language &amp; Region
          </h3>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={i < 3 ? "border-b border-neutral-100 dark:border-neutral-800" : ""}
              >
                <SkeletonRow />
              </div>
            ))
          ) : (
            <>
              {/* Locale */}
              <div className="flex flex-col gap-2 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                <Label
                  htmlFor="locale-select"
                  className="font-body text-sm font-medium text-neutral-900 dark:text-white"
                >
                  Language
                </Label>
                <Select
                  value={prefs.language.locale}
                  onValueChange={(val) => void saveLanguageField("locale", val)}
                >
                  <SelectTrigger id="locale-select">
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
              <div className="flex flex-col gap-2 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                <Label
                  htmlFor="date-format-select"
                  className="font-body text-sm font-medium text-neutral-900 dark:text-white"
                >
                  Date Format
                </Label>
                <Select
                  value={prefs.language.date_format}
                  onValueChange={(val) => void saveLanguageField("date_format", val)}
                >
                  <SelectTrigger id="date-format-select">
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
              <div className="flex flex-col gap-2 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                <Label
                  htmlFor="currency-select"
                  className="font-body text-sm font-medium text-neutral-900 dark:text-white"
                >
                  Currency
                </Label>
                <Select
                  value={prefs.language.currency}
                  onValueChange={(val) => void saveLanguageField("currency", val)}
                >
                  <SelectTrigger id="currency-select">
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
              <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <Label
                  htmlFor="timezone-select"
                  className="font-body text-sm font-medium text-neutral-900 dark:text-white"
                >
                  Timezone
                </Label>
                <Select
                  value={prefs.language.timezone}
                  onValueChange={(val) => void saveLanguageField("timezone", val)}
                >
                  <SelectTrigger id="timezone-select">
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
            </>
          )}
        </div>
      </section>

      {/* Accessibility */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Accessibility className="size-4 text-neutral-400" aria-hidden="true" />
          <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
            Accessibility
          </h3>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={i < 4 ? "border-b border-neutral-100 dark:border-neutral-800" : ""}
              >
                <SkeletonRow />
              </div>
            ))
          ) : (
            <>
              {/* Font size */}
              <div className="flex flex-col gap-2 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                <Label
                  htmlFor="font-size-select"
                  className="font-body text-sm font-medium text-neutral-900 dark:text-white"
                >
                  Font Size
                </Label>
                <Select
                  value={prefs.accessibility.font_size}
                  onValueChange={(val) => void saveAccessibilityField("font_size", val)}
                >
                  <SelectTrigger id="font-size-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reduced motion */}
              <div className="flex items-center justify-between border-b border-neutral-100 p-4 dark:border-neutral-800">
                <div>
                  <Label
                    htmlFor="reduced-motion"
                    className="cursor-pointer font-body text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    Reduced Motion
                  </Label>
                  <p className="font-body text-xs text-neutral-500">
                    Minimise animations and transitions.
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={prefs.accessibility.reduced_motion}
                  onCheckedChange={(checked) =>
                    void saveAccessibilityField("reduced_motion", checked)
                  }
                />
              </div>

              {/* High contrast */}
              <div className="flex items-center justify-between border-b border-neutral-100 p-4 dark:border-neutral-800">
                <div>
                  <Label
                    htmlFor="high-contrast"
                    className="cursor-pointer font-body text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    High Contrast
                  </Label>
                  <p className="font-body text-xs text-neutral-500">
                    Increase contrast for better readability.
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={prefs.accessibility.high_contrast}
                  onCheckedChange={(checked) =>
                    void saveAccessibilityField("high_contrast", checked)
                  }
                />
              </div>

              {/* Dark mode — segmented control */}
              <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                <div>
                  <p className="font-body text-sm font-medium text-neutral-900 dark:text-white">
                    Dark Mode
                  </p>
                  <p className="font-body text-xs text-neutral-500">
                    Choose your preferred colour scheme.
                  </p>
                </div>
                <div
                  className="inline-flex items-center gap-0.5 rounded-lg border border-neutral-200 p-0.5 dark:border-neutral-700"
                  role="radiogroup"
                  aria-label="Dark mode preference"
                >
                  {DARK_MODE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = prefs.accessibility.dark_mode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => void saveAccessibilityField("dark_mode", opt.value)}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                            : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                        }`}
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Screen reader hints */}
              <div className="flex items-center justify-between p-4">
                <div>
                  <Label
                    htmlFor="screen-reader-hints"
                    className="cursor-pointer font-body text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    Screen Reader Hints
                  </Label>
                  <p className="font-body text-xs text-neutral-500">
                    Add extra context for assistive technologies.
                  </p>
                </div>
                <Switch
                  id="screen-reader-hints"
                  checked={prefs.accessibility.screen_reader_hints}
                  onCheckedChange={(checked) =>
                    void saveAccessibilityField("screen_reader_hints", checked)
                  }
                />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
