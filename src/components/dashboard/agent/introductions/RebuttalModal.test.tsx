/**
 * Tests for RebuttalModal (TDD RED — component not yet implemented)
 *
 * Pins the contract of the "Dispute this introduction" rebuttal modal
 * (Truedeed Phase 1, design spec §6). Props-driven client component.
 *
 *  1. Renders the introduction facts: applicant name, listing address, and
 *     the formatted occurred-at date
 *  2. Labelled date input "Date of your prior contact" and a labelled file
 *     input accepting multiple files
 *  3. Submit blocked with /evidence file is required/i when no file attached
 *  4. Submit blocked with /must be before/i when the claimed evidence date is
 *     on/after the introduction's occurred-at date
 *  5. Valid date + at least one file calls onSubmit with the values
 *  6. Explanatory copy matching /5 business days/i is present
 *  7. open=false renders no modal content; close affordance calls onClose
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { RebuttalModal } from "@/components/dashboard/agent/introductions/RebuttalModal";

// ---------------------------------------------------------------------------
// Fixtures (synthetic)
// ---------------------------------------------------------------------------

const INTRODUCTION = {
  id: "intro-active-1",
  applicantName: "Amira Khan",
  listingAddress: "12 Cedar Avenue, Manchester M20 3GH",
  occurredAt: "2026-06-12T09:30:00.000Z",
};

const EVIDENCE_FILE = new File(["prior email thread"], "prior-contact.pdf", {
  type: "application/pdf",
});

const onClose = vi.fn();
const onSubmit = vi.fn();

function renderModal(open = true) {
  return render(
    <RebuttalModal
      introduction={INTRODUCTION}
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
    />,
  );
}

function getDateInput() {
  return screen.getByLabelText(/date of your prior contact/i);
}

function getFileInput() {
  return screen.getByLabelText(/evidence/i);
}

function getSubmitButton() {
  return screen.getByRole("button", { name: /submit/i });
}

function fillValidForm() {
  fireEvent.change(getDateInput(), { target: { value: "2026-06-01" } });
  fireEvent.change(getFileInput(), { target: { files: [EVIDENCE_FILE] } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RebuttalModal", () => {
  it("renders the applicant name, listing address, and formatted occurred-at date", () => {
    // Arrange / Act
    renderModal();

    // Assert — occurredAt 2026-06-12 formatted en-GB ("12 Jun 2026" / "12 June 2026")
    expect(screen.getByText(INTRODUCTION.applicantName)).toBeInTheDocument();
    expect(screen.getByText(INTRODUCTION.listingAddress)).toBeInTheDocument();
    expect(screen.getByText(/12\s+jun\w*\s+2026/i)).toBeInTheDocument();
  });

  it("renders a labelled prior-contact date input and a multiple-file evidence input", () => {
    // Arrange / Act
    renderModal();

    // Assert
    const dateInput = getDateInput();
    expect(dateInput).toBeInTheDocument();

    const fileInput = getFileInput();
    expect(fileInput).toHaveAttribute("type", "file");
    expect(fileInput).toHaveAttribute("multiple");
  });

  it("renders explanatory copy about the 5 business days rebuttal window", () => {
    // Arrange / Act
    renderModal();

    // Assert
    expect(screen.getByText(/5 business days/i)).toBeInTheDocument();
  });

  it("blocks submission with an evidence-file error when no file is attached", () => {
    // Arrange
    renderModal();
    fireEvent.change(getDateInput(), { target: { value: "2026-06-01" } });

    // Act
    fireEvent.click(getSubmitButton());

    // Assert
    expect(screen.getByText(/evidence file is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submission when the evidence date is not before the occurred-at date", () => {
    // Arrange — same day as occurredAt (2026-06-12), so not strictly before
    renderModal();
    fireEvent.change(getDateInput(), { target: { value: "2026-06-12" } });
    fireEvent.change(getFileInput(), { target: { files: [EVIDENCE_FILE] } });

    // Act
    fireEvent.click(getSubmitButton());

    // Assert
    expect(screen.getByText(/must be before/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the evidence date and files when the form is valid", () => {
    // Arrange
    renderModal();
    fillValidForm();

    // Act
    fireEvent.click(getSubmitButton());

    // Assert
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        evidenceDatedAt: "2026-06-01",
        files: expect.arrayContaining([EVIDENCE_FILE]),
      }),
    );
  });

  it("renders no modal content when open is false", () => {
    // Arrange / Act
    renderModal(false);

    // Assert
    expect(screen.queryByText(INTRODUCTION.applicantName)).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/date of your prior contact/i),
    ).not.toBeInTheDocument();
  });

  it("calls onClose when the close affordance is clicked", () => {
    // Arrange
    renderModal();

    // Act
    fireEvent.click(screen.getByRole("button", { name: /close|cancel/i }));

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
