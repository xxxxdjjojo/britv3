import type {
  HouseSubtype,
  PpdPropertyType,
  Tenure,
  UserTenure,
  UserPropertyDetails,
  SelectedAddress,
  ValuationSubject,
} from "@/types/valuation";

const SUBTYPE_TO_PPD: Readonly<Record<HouseSubtype, PpdPropertyType>> = {
  detached: "D",
  semi_detached: "S",
  terraced: "T",
  end_terrace: "T",
  bungalow: "D",
  flat: "F",
  other: "O",
};

/** Map the user's subtype choice to an HMLR property type. */
export function ppdTypeFromSubtype(subtype: HouseSubtype): PpdPropertyType {
  return SUBTYPE_TO_PPD[subtype];
}

/** Map the user's tenure choice to the HMLR freehold/leasehold code. */
export function tenureCode(tenure: UserTenure): Tenure {
  return tenure === "leasehold" ? "L" : "F"; // share_of_freehold/unknown weighted as freehold
}

/** Build the engine's subject from the selected address and user details. */
export function buildSubject(
  address: SelectedAddress,
  details: UserPropertyDetails,
): ValuationSubject {
  return {
    postcode: address.postcode,
    outwardCode: address.outwardCode,
    propertyType: ppdTypeFromSubtype(details.subtype),
    tenure: tenureCode(details.tenure),
    newBuild: details.newBuild,
    bedrooms: details.bedrooms,
    bathrooms: details.bathrooms,
    floorAreaSqm: details.floorAreaSqm,
    condition: details.condition,
    paon: address.paon,
    saon: address.saon,
    street: address.street,
  };
}
