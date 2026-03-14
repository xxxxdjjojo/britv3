"use client";

/**
 * 9.26 Notice Builder — Section 21 / Section 8
 * Allows landlords to generate legally-prescribed notices for possession.
 * Section 21 validates all prerequisites before enabling PDF generation.
 */

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  validateSection21Requirements,
  createNotice,
  listNotices,
  updateNoticeStatus,
} from "@/services/landlord/legal-notice-service";
import type { LegalNotice } from "@/types/landlord";

// Dynamic imports — ssr:false required for @react-pdf/renderer
const Section21PDFDownload = dynamic(
  () =>
    import("@/components/landlord/Section21NoticePDF").then((m) => ({
      default: m.Section21NoticePDFDownload,
    })),
  { ssr: false },
);
const Section8PDFDownload = dynamic(
  () =>
    import("@/components/landlord/Section8NoticePDF").then((m) => ({
      default: m.Section8NoticePDFDownload,
    })),
  { ssr: false },
);

// -- Schemas ------------------------------------------------------------------

const twoMonthsFromNow = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 2);
  return d.toISOString().slice(0, 10);
};

const section21Schema = z.object({
  tenancy_id: z.string().min(1, "Please select a tenancy"),
  possession_date: z
    .string()
    .min(1, "Possession date is required")
    .refine((d) => d >= twoMonthsFromNow(), {
      message: "Possession date must be at least 2 months from today",
    }),
  deposit_scheme_reference: z
    .string()
    .min(1, "Deposit scheme reference is required"),
  epc_provided: z.boolean().refine((v) => v === true, {
    message: "EPC must have been provided to the tenant",
  }),
  gas_safety_provided: z.boolean().refine((v) => v === true, {
    message: "Gas Safety Certificate must have been provided",
  }),
});

const section8Schema = z
  .object({
    tenancy_id: z.string().min(1, "Please select a tenancy"),
    grounds: z
      .array(z.string())
      .min(1, "At least one ground must be selected"),
    arrears_amount: z.coerce.number().optional(),
  })
  .refine(
    (data) =>
      !data.grounds.includes("ground_8") ||
      (data.arrears_amount !== undefined && data.arrears_amount > 0),
    {
      message: "Arrears amount is required when Ground 8 is selected",
      path: ["arrears_amount"],
    },
  );

type Section21FormData = z.infer<typeof section21Schema>;
type Section8FormData = z.infer<typeof section8Schema>;

// -- Tenancy option type ------------------------------------------------------

type TenancyOption = {
  id: string;
  tenant_name: string;
  property_address: string;
  deposit_scheme_reference?: string | null;
};

// -- Grounds list -------------------------------------------------------------

const S8_GROUNDS = [
  { value: "ground_8", label: "Ground 8 — Two or more months' rent arrears (mandatory)" },
  { value: "ground_10", label: "Ground 10 — Some rent arrears (discretionary)" },
  { value: "ground_11", label: "Ground 11 — Persistent delay in paying rent (discretionary)" },
  { value: "ground_12", label: "Ground 12 — Breach of tenancy obligation (discretionary)" },
  { value: "ground_13", label: "Ground 13 — Waste or neglect of property (discretionary)" },
  { value: "ground_14", label: "Ground 14 — Nuisance or annoyance (discretionary)" },
  { value: "ground_15", label: "Ground 15 — Damage to furniture (discretionary)" },
];

// -- Status badge -------------------------------------------------------------

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const colours: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    generated: "bg-blue-100 text-blue-700",
    served: "bg-green-100 text-green-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colours[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

// -- Main page ----------------------------------------------------------------

export default function NoticesPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"section21" | "section8">(
    "section21",
  );
  const [tenancies, setTenancies] = useState<TenancyOption[]>([]);
  const [notices, setNotices] = useState<LegalNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [createdNotice, setCreatedNotice] = useState<LegalNotice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register: registerS21,
    handleSubmit: handleSubmitS21,
    watch: watchS21,
    formState: { errors: errorsS21 },
  } = useForm<Section21FormData>({
    resolver: zodResolver(section21Schema) as Resolver<Section21FormData>,
    defaultValues: {
      epc_provided: false,
      gas_safety_provided: false,
    },
  });

  const {
    register: registerS8,
    handleSubmit: handleSubmitS8,
    watch: watchS8,
    formState: { errors: errorsS8 },
  } = useForm<Section8FormData>({
    resolver: zodResolver(section8Schema) as Resolver<Section8FormData>,
    defaultValues: { grounds: [] },
  });

  const s21Values = watchS21();
  const s8Values = watchS8();
  const s8GroundValues = s8Values.grounds ?? [];
  const s8HasGround8 = s8GroundValues.includes("ground_8");

  // Pre-flight validation for Section 21
  const s21Validation = validateSection21Requirements({
    epc_provided: s21Values.epc_provided ?? false,
    gas_safety_provided: s21Values.gas_safety_provided ?? false,
    deposit_scheme_reference: s21Values.deposit_scheme_reference ?? "",
    possession_date: s21Values.possession_date ?? "",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load tenancies
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: tenancyRows } = await supabase
          .from("tenancies")
          .select(
            `
            id,
            tenant_name,
            listings!tenancies_property_id_fkey (
              address_line_1,
              city,
              postcode
            ),
            deposit_registrations!deposit_registrations_tenancy_id_fkey (
              scheme_reference
            )
          `,
          )
          .eq("landlord_id", user.id)
          .eq("status", "active");

        if (tenancyRows) {
          setTenancies(
            tenancyRows.map((t) => {
              const listing = Array.isArray(t.listings)
                ? t.listings[0]
                : t.listings;
              const deposit = Array.isArray(t.deposit_registrations)
                ? t.deposit_registrations[0]
                : t.deposit_registrations;
              return {
                id: t.id as string,
                tenant_name: t.tenant_name as string,
                property_address: listing
                  ? `${listing.address_line_1}, ${listing.city} ${listing.postcode}`
                  : "Unknown address",
                deposit_scheme_reference:
                  (deposit?.scheme_reference as string | null) ?? null,
              };
            }),
          );
        }

        // Load existing notices
        const existingNotices = await listNotices(supabase);
        setNotices(existingNotices);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [supabase]);

  async function onSubmitS21(data: Section21FormData) {
    if (!s21Validation.valid) return;
    setSubmitting(true);
    try {
      const notice = await createNotice(supabase, {
        notice_type: "section_21",
        property_id: "",
        tenancy_id: data.tenancy_id,
        landlord_id: "",
        possession_date: data.possession_date,
        deposit_scheme_reference: data.deposit_scheme_reference,
        epc_provided: data.epc_provided,
        gas_safety_provided: data.gas_safety_provided,
        grounds: null,
        arrears_amount: null,
        served_date: null,
        pdf_storage_path: null,
        status: "draft",
      });
      setCreatedNotice({ ...notice, tenancy_id: data.tenancy_id });
      setNotices((prev) => [notice, ...prev]);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitS8(data: Section8FormData) {
    setSubmitting(true);
    try {
      const notice = await createNotice(supabase, {
        notice_type: "section_8",
        property_id: "",
        tenancy_id: data.tenancy_id,
        landlord_id: "",
        possession_date: null,
        deposit_scheme_reference: null,
        epc_provided: null,
        gas_safety_provided: null,
        grounds: data.grounds,
        arrears_amount: data.arrears_amount ?? null,
        served_date: null,
        pdf_storage_path: null,
        status: "draft",
      });
      setCreatedNotice(notice);
      setNotices((prev) => [notice, ...prev]);
    } finally {
      setSubmitting(false);
    }
  }

  async function markServed(noticeId: string) {
    await updateNoticeStatus(supabase, noticeId, "served", undefined);
    setNotices((prev) =>
      prev.map((n) =>
        n.id === noticeId ? { ...n, status: "served" as const } : n,
      ),
    );
  }

  const selectedS21Tenancy = tenancies.find(
    (t) => t.id === s21Values.tenancy_id,
  );
  const selectedS8Tenancy = tenancies.find(
    (t) => t.id === s8Values.tenancy_id,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notice Builder</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate Section 21 (no-fault) or Section 8 (breach) possession
          notices.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {(["section21", "section8"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 pb-3 text-sm font-medium ${
                activeTab === tab
                  ? "border-green-700 text-green-700"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab === "section21" ? "Section 21" : "Section 8"}
            </button>
          ))}
        </nav>
      </div>

      {/* Section 21 form */}
      {activeTab === "section21" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Section 21 — No-fault Notice
          </h2>
          <form onSubmit={handleSubmitS21(onSubmitS21)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Tenancy
              </label>
              <select
                {...registerS21("tenancy_id")}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">-- Select a tenancy --</option>
                {tenancies.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tenant_name} — {t.property_address}
                  </option>
                ))}
              </select>
              {errorsS21.tenancy_id && (
                <p className="mt-1 text-xs text-red-600">
                  {errorsS21.tenancy_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Possession Date
              </label>
              <input
                type="date"
                {...registerS21("possession_date")}
                min={twoMonthsFromNow()}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              {errorsS21.possession_date && (
                <p className="mt-1 text-xs text-red-600">
                  {errorsS21.possession_date.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Deposit Scheme Reference
              </label>
              <input
                type="text"
                {...registerS21("deposit_scheme_reference")}
                defaultValue={selectedS21Tenancy?.deposit_scheme_reference ?? ""}
                placeholder="e.g. TDS123456"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              {errorsS21.deposit_scheme_reference && (
                <p className="mt-1 text-xs text-red-600">
                  {errorsS21.deposit_scheme_reference.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...registerS21("epc_provided")}
                  className="rounded border-gray-300 text-green-700"
                />
                <span className="text-sm text-gray-700">
                  EPC (Energy Performance Certificate) was provided to the
                  tenant
                </span>
              </label>
              {errorsS21.epc_provided && (
                <p className="text-xs text-red-600">
                  {errorsS21.epc_provided.message}
                </p>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...registerS21("gas_safety_provided")}
                  className="rounded border-gray-300 text-green-700"
                />
                <span className="text-sm text-gray-700">
                  Gas Safety Certificate was provided within 28 days of tenancy
                  commencement
                </span>
              </label>
              {errorsS21.gas_safety_provided && (
                <p className="text-xs text-red-600">
                  {errorsS21.gas_safety_provided.message}
                </p>
              )}
            </div>

            {/* Pre-flight validation display */}
            {(s21Values.epc_provided !== undefined ||
              s21Values.gas_safety_provided !== undefined ||
              s21Values.deposit_scheme_reference) && (
              <div
                className={`rounded-md p-4 ${
                  s21Validation.valid
                    ? "bg-green-50 border border-green-200"
                    : "bg-amber-50 border border-amber-200"
                }`}
              >
                {s21Validation.valid ? (
                  <div className="flex items-center gap-2 text-green-800">
                    <span className="text-lg">✓</span>
                    <span className="text-sm font-medium">
                      All prerequisites met — you may generate the notice.
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 text-sm font-medium text-amber-800">
                      Prerequisites not met — resolve the following before
                      generating:
                    </p>
                    <ul className="list-disc pl-4 text-sm text-amber-700">
                      {s21Validation.errors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !s21Validation.valid}
                className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Notice"}
              </button>
            </div>
          </form>

          {/* PDF download after notice created */}
          {createdNotice?.notice_type === "section_21" && (
            <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-4">
              <p className="mb-3 text-sm font-medium text-green-800">
                Notice created — download the PDF to serve on your tenant.
              </p>
              <div className="flex flex-wrap gap-3">
                <Section21PDFDownload
                  notice={createdNotice}
                  noticeId={createdNotice.id}
                  tenantName={selectedS21Tenancy?.tenant_name ?? "Tenant"}
                  propertyAddress={
                    selectedS21Tenancy?.property_address ?? "Property address"
                  }
                  landlordName="Landlord"
                  landlordAddress=""
                />
                <button
                  onClick={() => void markServed(createdNotice.id)}
                  className="rounded-md border border-green-700 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
                >
                  Mark as Served
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 8 form */}
      {activeTab === "section8" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Section 8 — Breach of Tenancy Notice
          </h2>
          <form onSubmit={handleSubmitS8(onSubmitS8)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Tenancy
              </label>
              <select
                {...registerS8("tenancy_id")}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">-- Select a tenancy --</option>
                {tenancies.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tenant_name} — {t.property_address}
                  </option>
                ))}
              </select>
              {errorsS8.tenancy_id && (
                <p className="mt-1 text-xs text-red-600">
                  {errorsS8.tenancy_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Grounds for Possession
              </label>
              <div className="mt-2 space-y-2">
                {S8_GROUNDS.map((ground) => (
                  <label key={ground.value} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      value={ground.value}
                      {...registerS8("grounds")}
                      className="mt-0.5 rounded border-gray-300 text-green-700"
                    />
                    <span className="text-sm text-gray-700">{ground.label}</span>
                  </label>
                ))}
              </div>
              {errorsS8.grounds && (
                <p className="mt-1 text-xs text-red-600">
                  {errorsS8.grounds.message}
                </p>
              )}
            </div>

            {s8HasGround8 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Rent Arrears (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...registerS8("arrears_amount")}
                  placeholder="e.g. 2400.00"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                {errorsS8.arrears_amount && (
                  <p className="mt-1 text-xs text-red-600">
                    {errorsS8.arrears_amount.message}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Section 8 Notice"}
            </button>
          </form>

          {/* PDF download after S8 notice created */}
          {createdNotice?.notice_type === "section_8" && (
            <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="mb-3 text-sm font-medium text-amber-800">
                Section 8 notice created.
              </p>
              <div className="flex flex-wrap gap-3">
                <Section8PDFDownload
                  noticeId={createdNotice.id}
                  tenantName={selectedS8Tenancy?.tenant_name ?? "Tenant"}
                  propertyAddress={
                    selectedS8Tenancy?.property_address ?? "Property address"
                  }
                  landlordName="Landlord"
                  grounds={createdNotice.grounds ?? []}
                  arrearsAmount={createdNotice.arrears_amount ?? undefined}
                  noticeDate={new Date().toISOString().slice(0, 10)}
                />
                <button
                  onClick={() => void markServed(createdNotice.id)}
                  className="rounded-md border border-amber-700 px-4 py-2 text-sm font-medium text-amber-700"
                >
                  Mark as Served
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notices list */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Existing Notices
          </h2>
        </div>
        {loading ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            Loading notices...
          </div>
        ) : notices.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            No notices created yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {notice.notice_type === "section_21"
                      ? "Section 21"
                      : "Section 8"}{" "}
                    Notice
                  </p>
                  <p className="text-xs text-gray-500">
                    Created{" "}
                    {new Date(notice.created_at).toLocaleDateString("en-GB")}
                    {notice.possession_date &&
                      ` — Possession: ${new Date(notice.possession_date).toLocaleDateString("en-GB")}`}
                  </p>
                </div>
                <StatusBadge status={notice.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
