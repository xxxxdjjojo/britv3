"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  UserCircle,
  Camera,
  MapPin,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  Save,
  PlusCircle,
  GraduationCap,
} from "lucide-react";

const SPECIALISMS = [
  "First-time buyers",
  "Remortgage",
  "Buy-to-let",
  "Commercial",
  "Equity release",
  "Self-employed",
  "Bad credit",
  "Help to Buy",
];

export default function BrokerProfilePage() {
  const [businessName, setBusinessName] = useState("Bright Mortgages Ltd");
  const [contactName, setContactName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex@brightmortgages.co.uk");
  const [phone, setPhone] = useState("020 7946 0958");
  const [website, setWebsite] = useState("www.brightmortgages.co.uk");
  const [fcaNumber] = useState("123456");
  const [bio, setBio] = useState(
    "Experienced mortgage broker with over 10 years helping clients across London and the South East. Specialising in first-time buyers and complex cases including self-employed and contractor mortgages."
  );
  const [serviceArea, setServiceArea] = useState("London, Surrey, Kent");
  const [selectedSpecialisms, setSelectedSpecialisms] = useState<Set<string>>(
    new Set(["First-time buyers", "Remortgage", "Self-employed"])
  );
  const [liveStatus, setLiveStatus] = useState(true);

  function toggleSpecialism(specialism: string) {
    setSelectedSpecialisms((prev) => {
      const next = new Set(prev);
      if (next.has(specialism)) {
        next.delete(specialism);
      } else {
        next.add(specialism);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Editorial page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Profile Management
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
            Your Professional Identity
          </h1>
        </div>
        <Button className="shrink-0 bg-brand-primary text-white hover:bg-brand-primary-dark gap-1.5">
          <Save className="size-4" />
          Save Changes
        </Button>
      </div>

      {/* Two-column layout: main content left, sidebar right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* Bio & Professional Details */}
          <Card className="rounded-xl border-border">
            <CardContent className="p-6 space-y-6">
              <h2 className="font-heading text-lg font-bold tracking-tight text-neutral-900">
                Bio &amp; Professional Details
              </h2>

              {/* Avatar + biography row */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr]">
                {/* Avatar block */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="flex size-28 items-center justify-center rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300">
                      <UserCircle className="size-14 text-neutral-400" />
                    </div>
                    <button
                      type="button"
                      className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-brand-primary text-white shadow-sm hover:bg-brand-primary-dark transition-colors"
                    >
                      <Camera className="size-4" />
                    </button>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 text-center">
                    Profile Photo
                  </p>
                  <p className="text-[10px] text-neutral-400 text-center max-w-[110px]">
                    JPG or PNG, max 2MB
                  </p>
                </div>

                {/* Biography */}
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                    Professional Biography
                  </p>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={5}
                    className="w-full flex-1 rounded-lg border border-border px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                    placeholder="Describe your experience, approach, and how you help clients find the perfect mortgage..."
                  />
                  <p className="text-[11px] text-neutral-400 text-right">
                    {bio.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Qualifications */}
              <div className="flex flex-col gap-3 border-t border-border pt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                  Qualifications
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-4 shrink-0 text-brand-primary" />
                    <span className="text-sm text-neutral-700">
                      CeMAP (Certificate in Mortgage Advice and Practice)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-4 shrink-0 text-brand-primary" />
                    <span className="text-sm text-neutral-700">
                      BSc (Hons) in Financial Management
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand-primary transition-colors hover:text-brand-primary-dark w-fit"
                >
                  <PlusCircle className="size-3.5" />
                  Add Qualification
                </button>
              </div>

              {/* Contact details grid */}
              <div className="flex flex-col gap-4 border-t border-border pt-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="business-name" className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                      Business Name
                    </Label>
                    <Input
                      id="business-name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                      Contact Name
                    </Label>
                    <Input
                      id="contact-name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-email" className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500 flex items-center gap-1.5">
                      <Mail className="size-3 text-neutral-400" />
                      Email
                    </Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-phone" className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500 flex items-center gap-1.5">
                      <Phone className="size-3 text-neutral-400" />
                      Phone
                    </Label>
                    <Input
                      id="profile-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-website" className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500 flex items-center gap-1.5">
                      <Globe className="size-3 text-neutral-400" />
                      Website
                    </Label>
                    <Input
                      id="profile-website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-service-area" className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500 flex items-center gap-1.5">
                      <MapPin className="size-3 text-neutral-400" />
                      Service Area
                    </Label>
                    <Input
                      id="profile-service-area"
                      value={serviceArea}
                      onChange={(e) => setServiceArea(e.target.value)}
                      placeholder="e.g. London, Surrey, Kent"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Areas of Specialism */}
          <Card className="rounded-xl border-border">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-lg font-bold tracking-tight text-neutral-900">
                  Areas of Specialism
                </h2>
                <p className="text-xs text-neutral-500">
                  Select the areas where you have deep market expertise. These will be highlighted on your public profile.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SPECIALISMS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecialism(s)}
                    className={
                      selectedSpecialisms.has(s)
                        ? "rounded-full border-2 border-brand-primary bg-brand-primary px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
                        : "rounded-full border-2 border-border bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-300"
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* FCA Accredited card — dark green surface */}
          <Card className="rounded-xl overflow-hidden border-0">
            <CardContent className="p-0">
              <div className="bg-brand-primary p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-brand-gold" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-gold">
                    FCA Accredited
                  </span>
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold text-white">
                    Verified Broker
                  </p>
                  <p className="mt-1 text-xs text-white/70 leading-relaxed">
                    Your professional credentials have been validated against the Financial Conduct Authority register.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/60">
                    Registration Number
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-xl font-bold text-white">
                    FCA {fcaNumber}
                  </span>
                  <Badge className="bg-brand-gold text-brand-gold-foreground border-0 text-[10px] font-bold uppercase tracking-[0.06em]">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee Structure card */}
          <Card className="rounded-xl border-border">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-heading text-base font-bold tracking-tight text-neutral-900">
                Fee Structure
              </h2>

              <div className="flex flex-col gap-3">
                {/* Fixed Fee option */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="fee-type"
                    defaultChecked
                    className="mt-0.5 size-4 accent-brand-primary"
                    readOnly
                  />
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="text-sm font-medium text-neutral-700">Fixed Fee</span>
                    <span className="font-heading text-base font-bold text-neutral-900">£495</span>
                  </div>
                </label>

                {/* Percentage option */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="fee-type"
                    className="mt-0.5 size-4 accent-brand-primary"
                    readOnly
                  />
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="text-sm font-medium text-neutral-500">Percentage</span>
                    <span className="text-sm font-semibold text-neutral-500">0.3%</span>
                  </div>
                </label>

                {/* Fee-free option */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="fee-type"
                    className="mt-0.5 size-4 accent-brand-primary"
                    readOnly
                  />
                  <span className="text-sm font-medium text-neutral-500">Fee-free</span>
                </label>
              </div>

              <p className="text-[11px] text-neutral-400 leading-relaxed border-t border-border pt-3">
                Clients often value transparency. Consider giving a brief detail of what fees are payable in your bio.
              </p>
            </CardContent>
          </Card>

          {/* Live Status card */}
          <Card className="rounded-xl border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <h2 className="font-heading text-base font-bold tracking-tight text-neutral-900">
                    Live Status
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    Your profile is currently {liveStatus ? "visible" : "hidden"} online.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={liveStatus}
                  onClick={() => setLiveStatus((v) => !v)}
                  className={[
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
                    liveStatus ? "bg-brand-primary" : "bg-neutral-200",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-block size-4 rounded-full bg-white shadow transition-transform",
                      liveStatus ? "translate-x-6" : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className="flex flex-col gap-2 pt-1">
            <Button
              variant="outline"
              className="w-full border-border text-neutral-700 hover:bg-muted"
            >
              Preview Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full text-error hover:bg-error/10 hover:text-error"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Footer timestamp */}
      <p className="text-[11px] text-neutral-400">
        Last updated: Today at 09:32 AM
      </p>
    </div>
  );
}
