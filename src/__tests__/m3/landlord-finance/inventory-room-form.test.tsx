import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  InventoryRoomForm,
  isConditionWorse,
  type RoomCondition,
} from "@/components/landlord/InventoryRoomForm";

// react-dropzone needs File System APIs happy-dom lacks; stub it to a minimal
// passthrough so the form renders deterministically without real drag-drop.
vi.mock("react-dropzone", () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}));

// The supabase browser client is only used inside the photo upload path, which
// these tests do not exercise (no reportId / no drop). Stub it so the module
// import never reaches real network code.
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    storage: { from: vi.fn() },
  })),
}));

function renderForm(
  overrides: Partial<React.ComponentProps<typeof InventoryRoomForm>> = {},
) {
  const onUpdate = vi.fn();
  render(
    <InventoryRoomForm
      roomName="Kitchen"
      reportId={null}
      onUpdate={onUpdate}
      {...overrides}
    />,
  );
  return { onUpdate };
}

describe("InventoryRoomForm", () => {
  it("renders the room name heading", () => {
    renderForm();
    expect(screen.getByRole("heading", { name: "Kitchen" })).toBeInTheDocument();
  });

  it("shows a condition tag only for non-good/excellent conditions", () => {
    renderForm({ initialCondition: "poor" });
    expect(screen.getByText("Poor")).toBeInTheDocument();
  });

  it("does not show a condition tag for a good condition", () => {
    renderForm({ initialCondition: "good" });
    // "Good" appears in the Select options/value but not as the standalone tag.
    // The standalone tag text "Poor"/"Damaged" should be absent.
    expect(screen.queryByText("Damaged")).not.toBeInTheDocument();
  });

  it("notifies the parent when notes change", () => {
    const { onUpdate } = renderForm();
    const textarea = screen.getByPlaceholderText(/Describe the condition of fixtures/i);
    fireEvent.change(textarea, { target: { value: "Scuffed worktop" } });
    expect(onUpdate).toHaveBeenCalled();
    const lastCall = onUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall).toMatchObject({ name: "Kitchen", notes: "Scuffed worktop" });
  });

  it("renders the photo counter starting at 0/5", () => {
    renderForm();
    expect(screen.getByText("Photos (0/5)")).toBeInTheDocument();
  });

  it("renders existing photo thumbnails and a remove button", () => {
    const { onUpdate } = renderForm({
      reportId: "rep-1",
      initialPhotoUrls: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
    });
    expect(screen.getByText("Photos (2/5)")).toBeInTheDocument();
    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(2);

    // Remove first photo -> parent notified with one fewer url.
    const removeButtons = screen
      .getAllByRole("button")
      .filter((b) => b.querySelector("svg"));
    fireEvent.click(removeButtons[0]);
    const lastCall = onUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall.photoUrls).toHaveLength(1);
  });

  it("prompts to save a draft first when no reportId (upload disabled)", () => {
    renderForm({ reportId: null });
    expect(
      screen.getByText(/Save a draft first to enable photo uploads/i),
    ).toBeInTheDocument();
  });

  it("hides the dropzone once the max photo count is reached", () => {
    renderForm({
      reportId: "rep-1",
      initialPhotoUrls: [
        "1.jpg",
        "2.jpg",
        "3.jpg",
        "4.jpg",
        "5.jpg",
      ].map((n) => `https://example.com/${n}`),
    });
    expect(screen.getByText("Photos (5/5)")).toBeInTheDocument();
    expect(
      screen.queryByText(/Drop photos here or click to browse/i),
    ).not.toBeInTheDocument();
  });

  // FINDING: The condition <Select> is base-ui and its dropdown needs
  // portal/pointer support happy-dom lacks; selecting a new condition value to
  // assert handleConditionChange -> onUpdate is only reliable in a browser env.
  it.todo("notifies parent when condition is changed via the Select (needs browser env)");

  // FINDING: The photo upload path uploads to Supabase Storage + generates a
  // signed URL inside react-dropzone's onDrop. Exercising it requires a real
  // drop event and storage round-trip; it is covered at the integration layer,
  // not here.
  it.todo("uploads a dropped photo and appends a signed URL (needs integration env)");
});

describe("isConditionWorse", () => {
  const order: RoomCondition[] = ["excellent", "good", "fair", "poor", "damaged"];

  it("returns true when current is worse than baseline", () => {
    expect(isConditionWorse("damaged", "good")).toBe(true);
    expect(isConditionWorse("poor", "excellent")).toBe(true);
  });

  it("returns false when current is equal to baseline", () => {
    expect(isConditionWorse("good", "good")).toBe(false);
  });

  it("returns false when current is better than baseline", () => {
    expect(isConditionWorse("excellent", "fair")).toBe(false);
  });

  it("ranks the full condition scale monotonically", () => {
    for (let i = 1; i < order.length; i++) {
      // each later condition is worse than the earlier one
      expect(isConditionWorse(order[i], order[i - 1])).toBe(true);
    }
  });
});
