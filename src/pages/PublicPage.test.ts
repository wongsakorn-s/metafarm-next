import { describe, expect, it } from "vitest";
import {
  publicNavigationRoutes,
  publicRoutes,
  resolvePublicPath,
} from "./publicRoutes";

describe("public pages migrated from the original app", () => {
  it("keeps every original public route", () => {
    expect(publicRoutes.map((route) => route.path)).toEqual([
      "/",
      "/stingless-bee",
      "/stingless-bee-honey",
      "/product",
      "/training",
      "/pocketbook",
      "/contact",
    ]);
  });

  it("normalizes trailing slashes and handles unknown routes safely", () => {
    expect(resolvePublicPath("/stingless-bee/")).toBe("/stingless-bee");
    expect(resolvePublicPath("/contact")).toBe("/contact");
    expect(resolvePublicPath("/unknown")).toBe("/");
  });

  it("shows only ready pages in navigation", () => {
    expect(publicNavigationRoutes.map((route) => route.path)).toEqual([
      "/",
      "/stingless-bee",
      "/stingless-bee-honey",
      "/contact",
    ]);
  });
});
