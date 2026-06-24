// Light render test for the rent move-in cost card. The money math itself is
// already unit-tested in rental-cost.test.ts; here we only confirm the card
// surfaces the computed total and the income-needed figure.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RentMoveInCost } from "./RentMoveInCost";
import { moveInCost, incomeNeededAnnual } from "@/lib/properties/rental-cost";

describe("RentMoveInCost", () => {
  it("renders the total to move in and the income needed", () => {
    const monthlyRent = 1850;
    const depositAmount = 2135;
    const holdingDepositAmount = 427;

    render(
      <RentMoveInCost
        monthlyRent={monthlyRent}
        depositAmount={depositAmount}
        holdingDepositAmount={holdingDepositAmount}
        beds={2}
      />,
    );

    const expectedTotal = moveInCost({
      monthlyRent,
      deposit: depositAmount,
      holdingDeposit: holdingDepositAmount,
    }).totalUpfront;
    const expectedIncome = incomeNeededAnnual(monthlyRent);

    expect(screen.getByText("Total to move in")).toBeTruthy();
    expect(screen.getByText(`£${expectedTotal.toLocaleString("en-GB")}`)).toBeTruthy();
    expect(
      screen.getByText(`£${expectedIncome.toLocaleString("en-GB")}`),
    ).toBeTruthy();
  });
});
