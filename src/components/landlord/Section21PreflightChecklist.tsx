"use client";

/**
 * Section 21 Pre-flight Checklist
 * Landlords must manually confirm all 4 legal prerequisites before the
 * Section 21 notice form is unlocked. This acts as a first gate; the
 * existing Zod validation remains as a second gate inside the form.
 */

import { useState, useEffect } from "react";
import Link from "next/link";

type ChecklistItem = {
  id: string;
  label: string;
  detail: string;
  linkLabel: string;
  linkHref: string;
};

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "deposit_registered",
    label: "Deposit registered and scheme reference available",
    detail:
      "The tenant's deposit must be held in a government-approved scheme (DPS, MyDeposits or TDS) and the scheme reference must be to hand.",
    linkLabel: "View deposits",
    linkHref: "/dashboard/landlord/deposits",
  },
  {
    id: "epc_provided",
    label: "EPC (Energy Performance Certificate) provided to tenant",
    detail:
      "A valid EPC must have been given to the tenant at or before the start of the tenancy.",
    linkLabel: "View compliance",
    linkHref: "/dashboard/landlord/compliance",
  },
  {
    id: "gas_safety_provided",
    label: "Gas Safety Certificate current and provided to tenant",
    detail:
      "A current Gas Safety Record must have been provided to the tenant within 28 days of the annual check and before move-in.",
    linkLabel: "View compliance",
    linkHref: "/dashboard/landlord/compliance",
  },
  {
    id: "prescribed_information_served",
    label: "Prescribed Information served to tenant",
    detail:
      "The Prescribed Information (deposit scheme leaflet + scheme details) must have been served within 30 days of receiving the deposit.",
    linkLabel: "View compliance",
    linkHref: "/dashboard/landlord/compliance",
  },
];

export function Section21PreflightChecklist(
  props: Readonly<{
    onAllChecked: (allChecked: boolean) => void;
  }>,
) {
  const { onAllChecked } = props;
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item.id, false])),
  );

  const allChecked = CHECKLIST_ITEMS.every((item) => checked[item.id]);

  useEffect(() => {
    onAllChecked(allChecked);
  }, [allChecked, onAllChecked]);

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div
      className={`rounded-lg border p-5 transition-colors ${
        allChecked
          ? "border-success/30 bg-success-light"
          : "border-warning/30 bg-warning-light"
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            allChecked
              ? "bg-success text-white"
              : "bg-warning text-white"
          }`}
        >
          {allChecked ? "✓" : "!"}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Section 21 Pre-requisite Checklist
          </h3>
          <p className="mt-0.5 text-xs text-neutral-600">
            {allChecked
              ? "All prerequisites confirmed — the notice form is now unlocked."
              : "Confirm all 4 items below before the notice form becomes available. Issuing a Section 21 without meeting these prerequisites renders the notice invalid."}
          </p>
        </div>
      </div>

      <ol className="space-y-3">
        {CHECKLIST_ITEMS.map((item, index) => {
          const isChecked = checked[item.id];
          return (
            <li
              key={item.id}
              className={`rounded-md border p-3 transition-colors ${
                isChecked
                  ? "border-success/30 bg-white"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(item.id)}
                    className="h-4 w-4 cursor-pointer rounded border-neutral-300 text-success focus:ring-success"
                  />
                  {isChecked && (
                    <span className="pointer-events-none absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-success text-[8px] font-bold text-white">
                      ✓
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        isChecked ? "text-success" : "text-neutral-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isChecked ? "text-success" : "text-neutral-900"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">{item.detail}</p>
                  <Link
                    href={item.linkHref}
                    className="mt-1 inline-block text-xs font-medium text-success underline-offset-2 hover:underline"
                  >
                    {item.linkLabel} &rarr;
                  </Link>
                </div>
              </label>
            </li>
          );
        })}
      </ol>

      {allChecked && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-success/30 bg-white px-3 py-2">
          <span className="text-base">✅</span>
          <span className="text-sm font-medium text-success">
            All prerequisites confirmed. Scroll down to complete the notice.
          </span>
        </div>
      )}
    </div>
  );
}
