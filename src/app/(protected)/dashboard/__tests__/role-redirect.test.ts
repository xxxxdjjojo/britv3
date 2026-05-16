import { describe, it, expect } from "vitest";
import { roleToRoute } from "../role-route-map";

describe("roleToRoute", () => {
  it("maps service_provider to provider", () => {
    expect(roleToRoute("service_provider")).toBe("provider");
  });
  it("maps estate_agent to agent", () => {
    expect(roleToRoute("estate_agent")).toBe("agent");
  });
  it("maps mortgage_broker to broker", () => {
    expect(roleToRoute("mortgage_broker")).toBe("broker");
  });
  it("passes through homebuyer unchanged", () => {
    expect(roleToRoute("homebuyer")).toBe("homebuyer");
  });
  it("passes through renter unchanged", () => {
    expect(roleToRoute("renter")).toBe("renter");
  });
  it("passes through seller unchanged", () => {
    expect(roleToRoute("seller")).toBe("seller");
  });
  it("passes through landlord unchanged", () => {
    expect(roleToRoute("landlord")).toBe("landlord");
  });
});
