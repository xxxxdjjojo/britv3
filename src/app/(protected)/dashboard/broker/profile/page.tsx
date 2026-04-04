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
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-brand-secondary-dark mb-1">
            Profile &amp; Trust
          </span>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">Broker Profile</h1>
          <p className="mt-1 font-body text-sm text-neutral-500">
            Manage your public-facing profile information.
          </p>
        </div>
        <Button className="rounded-lg bg-brand-primary px-4 py-2 font-body text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2 gap-1.5">
          <Save className="size-4" />
          Save Changes
        </Button>
      </div>

      {/* Photo Upload */}
      <Card className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="flex size-24 items-center justify-center rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300">
                <UserCircle className="size-12 text-neutral-400" />
              </div>
              <button className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-brand-primary text-white shadow-sm hover:bg-brand-primary/90 transition-colors">
                <Camera className="size-4" />
              </button>
            </div>
            <div>
              <h3 className="font-body text-sm font-semibold text-foreground">Profile Photo</h3>
              <p className="font-body text-xs text-neutral-500 mt-1">
                Upload a professional photo. JPG or PNG, max 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 border-0">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-heading text-base font-semibold text-foreground">Business Details</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="business-name" className="font-body text-xs font-medium text-neutral-500">Business Name</Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card px-3 py-2 font-body text-sm text-foreground focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-name" className="font-body text-xs font-medium text-neutral-500">Contact Name</Label>
              <Input
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card px-3 py-2 font-body text-sm text-foreground focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-email" className="font-body text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                <Mail className="size-3.5 text-neutral-400" />
                Email
              </Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card px-3 py-2 font-body text-sm text-foreground focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone" className="font-body text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                <Phone className="size-3.5 text-neutral-400" />
                Phone
              </Label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card px-3 py-2 font-body text-sm text-foreground focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-website" className="font-body text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                <Globe className="size-3.5 text-neutral-400" />
                Website
              </Label>
              <Input
                id="profile-website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card px-3 py-2 font-body text-sm text-foreground focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-neutral-400" />
                FCA Number
              </Label>
              <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card">
                <span className="font-body text-sm text-foreground">{fcaNumber}</span>
                <Badge variant="outline" className="bg-success-light text-success dark:bg-success/20 dark:text-success border-0 text-[10px]">
                  Verified
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 border-0">
        <CardContent className="p-6 space-y-3">
          <h3 className="font-heading text-base font-semibold text-foreground">About You</h3>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card px-3 py-2 font-body text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2"
            placeholder="Tell potential clients about your experience and expertise..."
          />
          <p className="font-body text-xs text-neutral-500">{bio.length}/500 characters</p>
        </CardContent>
      </Card>

      {/* Specialisms */}
      <Card className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 border-0">
        <CardContent className="p-6 space-y-3">
          <h3 className="font-heading text-base font-semibold text-foreground">Specialisms</h3>
          <p className="font-body text-xs text-neutral-500">Select the mortgage types you specialise in.</p>
          <div className="flex flex-wrap gap-2">
            {SPECIALISMS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpecialism(s)}
                className={
                  selectedSpecialisms.has(s)
                    ? "rounded-full border-2 border-brand-primary bg-brand-primary-lighter px-3 py-1.5 font-body text-xs font-medium text-brand-primary transition-colors"
                    : "rounded-full border-2 border-neutral-200/60 dark:border-neutral-700/60 bg-card px-3 py-1.5 font-body text-xs font-medium text-neutral-600 hover:border-neutral-400 transition-colors"
                }
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Area */}
      <Card className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 border-0">
        <CardContent className="p-6 space-y-3">
          <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-1.5">
            <MapPin className="size-4 text-neutral-400" />
            Service Area
          </h3>
          <Input
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            placeholder="e.g. London, Surrey, Kent"
            className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card px-3 py-2 font-body text-sm text-foreground focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2"
          />
          <p className="font-body text-xs text-neutral-500">
            Comma-separated list of areas you cover.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
