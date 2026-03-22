"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStep } from "@/hooks/useOnboardingStep";
import { validateCompaniesHouseNumber, normalizeCompaniesHouseNumber } from "@/lib/validators/uk";
import { cn } from "@/lib/utils";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type CompanyData = {
  company_number: string;
  company_name: string;
  company_status: string;
  sic_codes: string[];
  registered_address: {
    line1: string;
    line2: string;
    city: string;
    county: string;
    postcode: string;
  };
  directors: Array<{ name: string; role: string }>;
};

export function CompaniesHouseStep(
  props: Readonly<{
    stepNumber: number;
    onSubmit: (data: CompanyData & { selected_director: string }) => void;
    onBack: () => void;
  }>,
) {
  const { saving, saveStep } = useOnboardingStep(props.stepNumber);
  const [companyNumber, setCompanyNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [selectedDirector, setSelectedDirector] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    const normalized = normalizeCompaniesHouseNumber(companyNumber);
    if (!validateCompaniesHouseNumber(normalized)) {
      setError("Company number must be 8 characters (e.g. 01234567 or SC123456)");
      return;
    }

    setVerifying(true);
    setError(null);
    setCompanyData(null);

    try {
      const res = await fetch("/api/verify/companies-house", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_number: normalized }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      setCompanyData(data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit() {
    if (!companyData || !selectedDirector) return;

    await saveStep(async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("agencies").upsert(
        {
          owner_id: user.id,
          name: companyData.company_name,
          companies_house_no: companyData.company_number,
          company_status: companyData.company_status,
          company_sic_codes: companyData.sic_codes,
          director_name: selectedDirector,
          address: `${companyData.registered_address.line1}, ${companyData.registered_address.city}, ${companyData.registered_address.postcode}`,
          ch_verified_at: new Date().toISOString(),
        },
        { onConflict: "owner_id" },
      );

      return companyData;
    });

    props.onSubmit({ ...companyData, selected_director: selectedDirector });
  }

  const fieldVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.3 },
    }),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Companies House Verification
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Enter your company number to verify your business registration.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Company Number</Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. 01234567 or SC123456"
            value={companyNumber}
            onChange={(e) => {
              setCompanyNumber(e.target.value.toUpperCase());
              setError(null);
            }}
            maxLength={8}
            className="h-11 font-mono uppercase"
          />
          <Button
            type="button"
            onClick={handleVerify}
            disabled={verifying || companyNumber.length < 8}
            className="min-w-[120px]"
          >
            {verifying ? (
              <><Loader2 className="mr-2 size-4 animate-spin" />Verifying</>
            ) : (
              "Verify"
            )}
          </Button>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="size-4" />
            {error}
          </div>
        )}
      </div>

      <AnimatePresence>
        {companyData && (
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5"
          >
            <motion.div variants={fieldVariants} custom={0} className="flex items-center gap-2">
              <Check className="size-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">Company Verified</span>
            </motion.div>

            <motion.div variants={fieldVariants} custom={1}>
              <Label className="text-xs text-neutral-500">Company Name</Label>
              <p className="text-sm font-medium text-neutral-900">{companyData.company_name}</p>
            </motion.div>

            <motion.div variants={fieldVariants} custom={2}>
              <Label className="text-xs text-neutral-500">Registered Address</Label>
              <p className="text-sm text-neutral-700">
                {companyData.registered_address.line1}
                {companyData.registered_address.city && `, ${companyData.registered_address.city}`}
                {companyData.registered_address.postcode && `, ${companyData.registered_address.postcode}`}
              </p>
            </motion.div>

            <motion.div variants={fieldVariants} custom={3}>
              <Label className="text-xs text-neutral-500">SIC Codes</Label>
              <p className="text-sm text-neutral-700">{companyData.sic_codes.join(", ") || "None listed"}</p>
            </motion.div>

            {companyData.directors.length > 0 && (
              <motion.div variants={fieldVariants} custom={4} className="space-y-2">
                <Label>Select Your Name (Director)</Label>
                <div className="space-y-2">
                  {companyData.directors.map((director) => (
                    <button
                      key={director.name}
                      type="button"
                      onClick={() => setSelectedDirector(director.name)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition-all",
                        selectedDirector === director.name
                          ? "border-brand-primary bg-brand-primary/5 font-medium"
                          : "border-neutral-200 hover:border-neutral-300",
                      )}
                    >
                      <span>{director.name}</span>
                      {selectedDirector === director.name && (
                        <Check className="size-4 text-brand-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <Button variant="outline" onClick={props.onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!companyData || !selectedDirector || saving}
          className="flex-1"
        >
          {saving ? "Saving..." : "Save and Continue"}
        </Button>
      </div>
    </div>
  );
}
