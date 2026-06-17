import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NumberedSteps } from "./NumberedSteps";

describe("NumberedSteps", () => {
  it("renders each step's title and body inside an ordered list", () => {
    render(
      <NumberedSteps
        steps={[
          { title: "Document the incident", body: "Keep records." },
          { title: "Contact us", body: "Email compliance." },
        ]}
      />,
    );

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("Document the incident")).toBeInTheDocument();
    expect(screen.getByText("Contact us")).toBeInTheDocument();
  });

  it("zero-pads the step numbers", () => {
    render(<NumberedSteps steps={[{ title: "First", body: "x" }]} />);
    expect(screen.getByText("01")).toBeInTheDocument();
  });
});
