/**
 * Tests for ReportOutcomeModal (TDD RED — component not yet implemented)
 *
 * Pins the contract of the agent "Report outcome" modal (Truedeed Phase 2).
 * Props-driven client component.
 *
 *  1. Renders the introduction facts: applicant name and listing address
 *  2. Labelled select "Outcome" with options Offer accepted / Exchanged /
 *     Completed / Fell through
 *  3. Selecting "Completed" reveals labelled "Completion date" (date) and
 *     "Agreed price" (number, pounds) inputs — hidden for other outcomes
 *  4. Submitting Completed without date or price shows /required/i and does
 *     NOT call onSubmit
 *  5. Valid Completed submit calls onSubmit with completionDate and the
 *     pounds→pence converted agreedPricePence (450000 typed → 45000000)
 *  6. "Fell through" submits immediately with { outcome: 'fell_through' }
 *  7. open=false renders no modal content; cancel affordance calls onClose
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ReportOutcomeModal } from "@/components/dashboard/agent/introductions/ReportOutcomeModal";

// ---------------------------------------------------------------------------
// Fixtures (synthetic)
// ---------------------------------------------------------------------------

const INTRODUCTION = {
  id: "intro-outcome-1",
  applicantName: "Amira Khan",
  listingAddress: "12 Cedar Avenue, Manchester M20 3GH",
};

const onClose = vi.fn();
const onSubmit = vi.fn();

function renderModal(open = true) {
  return render(
    <ReportOutcomeModal
      introduction={INTRODUCTION}
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
    />,
  );
}

function getOutcomeSelect() {
  return screen.getByLabelText(/outcome/i);
}

/**
 * Select an outcome by its visible option label, regardless of the option's
 * underlying value attribute.
 */
function selectOutcome(optionName: RegExp) {
  const option = screen.getByRole("option", {
    name: optionName,
  }) as HTMLOptionElement;
  fireEvent.change(getOutcomeSelect(), { target: { value: option.value } });
}

function getSubmitButton() {
  return screen.getByRole("button", { name: /submit|report/i });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ReportOutcomeModal", () => {
  it("renders the applicant name and listing address", () => {
    // Arrange / Act
    renderModal();

    // Assert
    expect(screen.getByText(INTRODUCTION.applicantName)).toBeInTheDocument();
    expect(screen.getByText(INTRODUCTION.listingAddress)).toBeInTheDocument();
  });

  it("renders a labelled Outcome select with the four outcome options", () => {
    // Arrange / Act
    renderModal();

    // Assert
    expect(getOutcomeSelect()).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /offer accepted/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /exchanged/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /completed/i })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /fell through/i }),
    ).toBeInTheDocument();
  });

  it("reveals labelled Completion date and Agreed price inputs when Completed is selected", () => {
    // Arrange
    renderModal();

    // Act
    selectOutcome(/^completed$/i);

    // Assert
    const dateInput = screen.getByLabelText(/completion date/i);
    expect(dateInput).toHaveAttribute("type", "date");

    const priceInput = screen.getByLabelText(/agreed price/i);
    expect(priceInput).toHaveAttribute("type", "number");
  });

  it.each([
    ["Offer accepted", /offer accepted/i],
    ["Exchanged", /exchanged/i],
    ["Fell through", /fell through/i],
  ])(
    "hides the completion date and agreed price inputs when %s is selected",
    (_label, optionName) => {
      // Arrange
      renderModal();

      // Act
      selectOutcome(optionName);

      // Assert
      expect(screen.queryByLabelText(/completion date/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/agreed price/i)).not.toBeInTheDocument();
    },
  );

  it("blocks a Completed submission with /required/i when date and price are empty", () => {
    // Arrange
    renderModal();
    selectOutcome(/^completed$/i);

    // Act
    fireEvent.click(getSubmitButton());

    // Assert
    expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks a Completed submission with /required/i when the price is missing", () => {
    // Arrange — date filled, price left empty
    renderModal();
    selectOutcome(/^completed$/i);
    fireEvent.change(screen.getByLabelText(/completion date/i), {
      target: { value: "2026-06-01" },
    });

    // Act
    fireEvent.click(getSubmitButton());

    // Assert
    expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid Completed outcome converting the pounds price to pence", () => {
    // Arrange — agent types the agreed price in POUNDS (450000 → 45000000p)
    renderModal();
    selectOutcome(/^completed$/i);
    fireEvent.change(screen.getByLabelText(/completion date/i), {
      target: { value: "2026-06-01" },
    });
    fireEvent.change(screen.getByLabelText(/agreed price/i), {
      target: { value: "450000" },
    });

    // Act
    fireEvent.click(getSubmitButton());

    // Assert
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: "completed",
        completionDate: "2026-06-01",
        agreedPricePence: 45_000_000,
      }),
    );
  });

  it("submits a Fell through outcome immediately without date or price", () => {
    // Arrange
    renderModal();
    selectOutcome(/fell through/i);

    // Act
    fireEvent.click(getSubmitButton());

    // Assert
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "fell_through" }),
    );
  });

  it("renders no modal content when open is false", () => {
    // Arrange / Act
    renderModal(false);

    // Assert
    expect(
      screen.queryByText(INTRODUCTION.applicantName),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/outcome/i)).not.toBeInTheDocument();
  });

  it("calls onClose when the cancel affordance is clicked", () => {
    // Arrange
    renderModal();

    // Act
    fireEvent.click(screen.getByRole("button", { name: /cancel|close/i }));

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
