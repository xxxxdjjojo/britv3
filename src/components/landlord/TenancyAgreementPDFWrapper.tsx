"use client";

import dynamic from "next/dynamic";
import type { Tenancy } from "@/types/landlord";

// Must be in a Client Component to use ssr: false
const TenancyAgreementPDFDownload = dynamic(
  () =>
    import("@/components/landlord/TenancyAgreementPDF").then(
      (mod) => mod.TenancyAgreementPDFDownload,
    ),
  { ssr: false },
);

type Props = Readonly<{
  tenancy: Tenancy;
  landlordName: string;
  propertyAddress: string;
}>;

export function TenancyAgreementPDFWrapper({ tenancy, landlordName, propertyAddress }: Props) {
  return (
    <TenancyAgreementPDFDownload
      tenancy={tenancy}
      landlordName={landlordName}
      propertyAddress={propertyAddress}
    />
  );
}
