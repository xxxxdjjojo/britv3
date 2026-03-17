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
          <h1 className="text-2xl font-bold text-neutral-900">Broker Profile</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your public-facing profile information.
          </p>
        </div>
        <Button className="bg-[#1B4D3E] text-white hover:bg-[#163d31] gap-1.5">
          <Save className="size-4" />
          Save Changes
        </Button>
      </div>

      {/* Photo Upload */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="flex size-24 items-center justify-center rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300">
                <UserCircle className="size-12 text-neutral-400" />
              </div>
              <button className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-[#1B4D3E] text-white shadow-sm hover:bg-[#163d31]">
                <Camera className="size-4" />
              </button>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Profile Photo</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Upload a professional photo. JPG or PNG, max 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-neutral-900">Business Details</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="business-name" className="text-sm font-medium">Business Name</Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-name" className="text-sm font-medium">Contact Name</Label>
              <Input
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-email" className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="size-3.5 text-neutral-400" />
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
              <Label htmlFor="profile-phone" className="text-sm font-medium flex items-center gap-1.5">
                <Phone className="size-3.5 text-neutral-400" />
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
              <Label htmlFor="profile-website" className="text-sm font-medium flex items-center gap-1.5">
                <Globe className="size-3.5 text-neutral-400" />
                Website
              </Label>
              <Input
                id="profile-website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-neutral-400" />
                FCA Number
              </Label>
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-neutral-200 bg-neutral-50">
                <span className="text-sm text-neutral-700">{fcaNumber}</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  Verified
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h3 className="text-base font-semibold text-neutral-900">About You</h3>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E] focus:border-transparent"
            placeholder="Tell potential clients about your experience and expertise..."
          />
          <p className="text-xs text-neutral-400">{bio.length}/500 characters</p>
        </CardContent>
      </Card>

      {/* Specialisms */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h3 className="text-base font-semibold text-neutral-900">Specialisms</h3>
          <p className="text-xs text-neutral-500">Select the mortgage types you specialise in.</p>
          <div className="flex flex-wrap gap-2">
            {SPECIALISMS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpecialism(s)}
                className={
                  selectedSpecialisms.has(s)
                    ? "rounded-full border-2 border-[#1B4D3E] bg-[#E8F5EE] px-3 py-1.5 text-xs font-semibold text-[#1B4D3E] transition-colors"
                    : "rounded-full border-2 border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-300"
                }
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Area */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-1.5">
            <MapPin className="size-4 text-neutral-400" />
            Service Area
          </h3>
          <Input
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            placeholder="e.g. London, Surrey, Kent"
          />
          <p className="text-xs text-neutral-400">
            Comma-separated list of areas you cover.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
