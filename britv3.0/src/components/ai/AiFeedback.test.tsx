import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { AiFeedback } from "./AiFeedback";

// -- Mocks --------------------------------------------------------------------

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: "user-123" } },
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({ insert: mockInsert }),
  }),
}));

// -- Tests --------------------------------------------------------------------

describe("AiFeedback", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("renders thumbs up and thumbs down buttons", () => {
    render(<AiFeedback featureId="property_description" referenceId="listing-1" />);

    expect(screen.getByLabelText("Thumbs up")).toBeInTheDocument();
    expect(screen.getByLabelText("Thumbs down")).toBeInTheDocument();
  });

  it("clicking thumbs up calls Supabase insert with rating 'positive'", async () => {
    render(<AiFeedback featureId="property_description" referenceId="listing-1" />);

    fireEvent.click(screen.getByLabelText("Thumbs up"));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: "property_description",
          reference_id: "listing-1",
          user_id: "user-123",
          rating: "positive",
        }),
      );
    });
  });

  it("clicking thumbs down shows comment textarea", async () => {
    render(<AiFeedback featureId="property_description" referenceId="listing-1" />);

    fireEvent.click(screen.getByLabelText("Thumbs down"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/what could be improved/i)).toBeInTheDocument();
    });
  });

  it("submitting negative feedback with comment calls insert with both", async () => {
    render(<AiFeedback featureId="property_description" referenceId="listing-1" />);

    fireEvent.click(screen.getByLabelText("Thumbs down"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/what could be improved/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/what could be improved/i);
    fireEvent.change(textarea, { target: { value: "Too generic" } });

    fireEvent.click(screen.getByText("Submit Feedback"));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: "negative",
          comment: "Too generic",
        }),
      );
    });
  });

  it("shows confirmation message after submission", async () => {
    render(<AiFeedback featureId="property_description" referenceId="listing-1" />);

    fireEvent.click(screen.getByLabelText("Thumbs up"));

    await waitFor(() => {
      expect(screen.getByText("Thanks for your feedback")).toBeInTheDocument();
    });
  });

  it("disables buttons after submission (prevent double-submit)", async () => {
    render(<AiFeedback featureId="property_description" referenceId="listing-1" />);

    fireEvent.click(screen.getByLabelText("Thumbs up"));

    await waitFor(() => {
      expect(screen.getByText("Thanks for your feedback")).toBeInTheDocument();
    });

    // After submission, the buttons are replaced by the confirmation message
    expect(screen.queryByLabelText("Thumbs up")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Thumbs down")).not.toBeInTheDocument();
  });
});
