import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// BUG F8/F7: DialogTrigger stripped `asChild` and rendered its own <button>
// around children, so `<DialogTrigger asChild><button>…` produced a nested
// <button> (invalid DOM). The fix translates `asChild` to base-ui's `render`
// prop so the child element is used directly.
describe("DialogTrigger asChild", () => {
  it("renders a single button (no nesting) when asChild is set", () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button type="button">Open</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getAllByRole("button", { name: "Open" })).toHaveLength(1);
  });

  it("still opens the dialog on click", () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button type="button">Open</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Hello Dialog</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByText("Hello Dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("Hello Dialog")).toBeInTheDocument();
  });
});

describe("AlertDialogTrigger asChild", () => {
  it("renders a single button (no nesting) when asChild is set", () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button type="button">Confirm</button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Alert</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(screen.getAllByRole("button", { name: "Confirm" })).toHaveLength(1);
  });

  it("still opens the alert dialog on click", () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button type="button">Confirm</button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });
});
