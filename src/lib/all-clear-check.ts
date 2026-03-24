/**
 * Determines if the landlord dashboard is in "all clear" state.
 * All clear = rent paid + compliance green + no open maintenance + at least 1 property.
 */

export type AllClearInput = Readonly<{
  totalOverdueRent: number;
  expiredCompliance: number;
  expiringSoonCompliance: number;
  openMaintenance: number;
  totalProperties: number;
}>;

export function isAllClear(input: AllClearInput): boolean {
  if (input.totalProperties === 0) return false;
  return (
    input.totalOverdueRent === 0 &&
    input.expiredCompliance === 0 &&
    input.expiringSoonCompliance === 0 &&
    input.openMaintenance === 0
  );
}
