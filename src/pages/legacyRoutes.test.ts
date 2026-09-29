import { describe, expect, it } from "vitest";
import { legacyAdminDestination } from "./legacyRoutes";

describe("old admin entry URLs", () => {
  it.each([
    ["/login", "/admin"],
    ["/dashboard", "/admin"],
    ["/hives", "/admin#hives"],
    ["/hives/MF-001", "/admin#hives"],
    ["/users", "/admin#team"],
    ["/print-qr", "/admin#qr"],
  ])("routes %s through the protected admin page", (path, destination) => {
    expect(legacyAdminDestination(path)).toBe(destination);
  });

  it("does not redirect public or unknown URLs", () => {
    expect(legacyAdminDestination("/contact")).toBeNull();
    expect(legacyAdminDestination("/unknown")).toBeNull();
  });
});
