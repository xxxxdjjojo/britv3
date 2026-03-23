"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ArrowLeft, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { submitApplicationAction } from "../../actions";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const applicationSchema = z.object({
  applicant_name: z.string().min(1, "Full name is required").max(200),
  applicant_email: z.string().email("Valid email is required"),
  employment_status: z.string().min(1, "Employment status is required"),
  annual_income: z.coerce
    .number()
    .positive("Income must be positive"),
  move_in_date: z.string().min(1, "Preferred move-in date is required"),
  notes: z.string().max(2000, "Cover letter must be under 2000 characters").optional().or(z.literal("")),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const EMPLOYMENT_OPTIONS = [
  { value: "full_time", label: "Full-time employed" },
  { value: "part_time", label: "Part-time employed" },
  { value: "self_employed", label: "Self-employed" },
  { value: "contractor", label: "Contractor" },
  { value: "student", label: "Student" },
  { value: "retired", label: "Retired" },
  { value: "unemployed", label: "Unemployed" },
  { value: "other", label: "Other" },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ApplyPage() {
  const rawParams = useParams<{ role: string; listingId: string }>();
  const role = rawParams.role as string;
  const listingId = rawParams.listingId as string;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema) as Resolver<ApplicationFormData>,
    defaultValues: {
      applicant_name: "",
      applicant_email: "",
      employment_status: "",
      annual_income: undefined,
      move_in_date: "",
      notes: "",
    },
  });

  function onSubmit(data: ApplicationFormData) {
    setServerError(null);
    startTransition(async () => {
      const result = await submitApplicationAction({
        property_id: listingId,
        applicant_name: data.applicant_name,
        applicant_email: data.applicant_email,
        employment_status: data.employment_status,
        monthly_income: Math.round(data.annual_income / 12),
        notes: data.notes || null,
      });

      if (result.success) {
        router.push(`/dashboard/${role}/applications`);
      } else {
        setServerError(result.error ?? "Failed to submit application");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/${role}/applications`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to applications
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Apply to Rent</CardTitle>
          <CardDescription>
            Complete the form below to submit your rental application. The landlord will be notified and review your details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <p>{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full name */}
            <div className="space-y-2">
              <Label htmlFor="applicant_name">Full name *</Label>
              <Input
                id="applicant_name"
                placeholder="Jane Smith"
                {...register("applicant_name")}
              />
              {errors.applicant_name && (
                <p className="text-sm text-destructive">{errors.applicant_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="applicant_email">Email address *</Label>
              <Input
                id="applicant_email"
                type="email"
                placeholder="jane@example.com"
                {...register("applicant_email")}
              />
              {errors.applicant_email && (
                <p className="text-sm text-destructive">{errors.applicant_email.message}</p>
              )}
            </div>

            {/* Employment status */}
            <div className="space-y-2">
              <Label htmlFor="employment_status">Employment status *</Label>
              <Select
                onValueChange={(val) => setValue("employment_status", val as string, { shouldValidate: true })}
              >
                <SelectTrigger id="employment_status">
                  <SelectValue placeholder="Select employment status" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employment_status && (
                <p className="text-sm text-destructive">{errors.employment_status.message}</p>
              )}
            </div>

            {/* Annual income */}
            <div className="space-y-2">
              <Label htmlFor="annual_income">Annual income (GBP) *</Label>
              <Input
                id="annual_income"
                type="number"
                placeholder="35000"
                {...register("annual_income")}
              />
              {errors.annual_income && (
                <p className="text-sm text-destructive">{errors.annual_income.message}</p>
              )}
            </div>

            {/* Move-in date */}
            <div className="space-y-2">
              <Label htmlFor="move_in_date">Preferred move-in date *</Label>
              <Input
                id="move_in_date"
                type="date"
                {...register("move_in_date")}
              />
              {errors.move_in_date && (
                <p className="text-sm text-destructive">{errors.move_in_date.message}</p>
              )}
            </div>

            {/* Cover letter / notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Cover letter / additional notes</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Tell the landlord about yourself, why you're interested in this property, and any other relevant information..."
                {...register("notes")}
              />
              {errors.notes && (
                <p className="text-sm text-destructive">{errors.notes.message}</p>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="size-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
